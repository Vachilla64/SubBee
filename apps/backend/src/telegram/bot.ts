import { Bot } from 'grammy';
import { config } from '../config';
import { db } from '../db';
import { createNombaVirtualAccount } from '../services/nomba/accounts';

if (!config.TELEGRAM_BOT_TOKEN) {
  throw new Error('[telegram/bot] TELEGRAM_BOT_TOKEN must be configured at startup.');
}

// Initialize the grammY bot instance
export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

/**
 * Onboard user and generate virtual account numbers
 */
bot.command('start', async (ctx) => {
  const telegramChatId = String(ctx.chat.id);
  const username = ctx.from?.username ?? '';
  const firstName = ctx.from?.first_name ?? 'SubBee User';

  try {
    await ctx.reply('🐝 *Welcome to SubBee!* Please wait while we set up your subscription wallet...', {
      parse_mode: 'Markdown',
    });

    // 1. Check if user already exists
    let userResult = await db.query('SELECT id FROM users WHERE telegram_chat_id = $1', [telegramChatId]);
    let userId: string;

    if (userResult.rowCount === 0) {
      // Create new user in database
      const insertResult = await db.query(
        'INSERT INTO users (telegram_chat_id, kyc_status) VALUES ($1, $2) RETURNING id',
        [telegramChatId, 'none']
      );
      userId = insertResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // 2. Check if user already has a virtual account
    const accountResult = await db.query('SELECT bank_account_number, bank_name FROM virtual_accounts WHERE user_id = $1', [userId]);

    let bankAccount: string;
    let bankName: string;

    if (accountResult.rowCount === 0) {
      // Create static account via Nomba API
      const accountName = `SubBee - ${username || firstName}`;
      const nombaAccount = await createNombaVirtualAccount({
        accountRef: userId,
        accountName,
      });

      // Save static account in database
      await db.query(
        'INSERT INTO virtual_accounts (user_id, account_ref, bank_account_number, bank_name) VALUES ($1, $2, $3, $4)',
        [userId, userId, nombaAccount.bankAccountNumber, nombaAccount.bankName]
      );

      bankAccount = nombaAccount.bankAccountNumber;
      bankName = nombaAccount.bankName;
    } else {
      bankAccount = accountResult.rows[0].bank_account_number;
      bankName = accountResult.rows[0].bank_name;
    }

    // 3. Output Onboarding Message
    await ctx.reply(
      `🎉 *Account setup complete!*\n\n` +
      `Here is your permanent virtual bank account number to fund your SubBee balance:\n\n` +
      `🏦 *Bank Name:* ${bankName}\n` +
      `🔢 *Account Number:* \`${bankAccount}\`\n` +
      `👤 *Beneficiary:* SubBee - ${username || firstName}\n\n` +
      `Transfer funds here to top up your SubBee balance. Use /balance to view your current balance.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('[telegram/bot] Error running start command:', error);
    await ctx.reply('⚠️ Sorry, there was an error setting up your account. Please try again in a few moments.');
  }
});

/**
 * Check wallet balance
 */
bot.command('balance', async (ctx) => {
  const telegramChatId = String(ctx.chat.id);

  try {
    // 1. Get user record
    const userResult = await db.query('SELECT id FROM users WHERE telegram_chat_id = $1', [telegramChatId]);
    if (userResult.rows.length === 0) {
      await ctx.reply('⚠️ You do not have a SubBee account yet. Run /start to set one up!');
      return;
    }
    const userId = userResult.rows[0].id;

    // 2. Query ledger balance cache
    const walletResult = await db.query(
      'SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = $2',
      [userId, 'wallet']
    );

    const balanceKobo = walletResult.rows.length > 0 ? BigInt(walletResult.rows[0].current_balance) : 0n;
    const balanceNaira = (Number(balanceKobo) / 100).toFixed(2);

    await ctx.reply(`🐝 *Your SubBee Wallet Balance:*\n\n*Naira:* ₦${balanceNaira}`, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('[telegram/bot] Balance query error:', error);
    await ctx.reply('⚠️ Error fetching wallet balance. Please try again.');
  }
});

// Start the bot using long polling in local/dev environments
if (config.NODE_ENV !== 'test') {
  bot.start({
    onStart: (info) => {
      console.log(`[telegram/bot] Bot @${info.username} started successfully.`);
    },
  });
}
