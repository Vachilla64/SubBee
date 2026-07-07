import { Bot } from 'grammy';
import { config } from '../config';
import { db } from '../db';
import { createNombaVirtualAccount } from '../services/nomba/accounts';
import { bridgecard } from '../services/bridgecard/client';
import { fundVirtualCard } from '../services/funding';
import { processNaturalLanguageCommand, UserContext } from '../services/ai';

if (!config.TELEGRAM_BOT_TOKEN) {
  throw new Error('[telegram/bot] TELEGRAM_BOT_TOKEN must be configured at startup.');
}

// Initialize the grammY bot instance
export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

/**
 * Start handler supporting deep-link profile connection
 */
bot.command('start', async (ctx) => {
  const telegramChatId = String(ctx.chat.id);
  const username = ctx.from?.username ?? '';
  const firstName = ctx.from?.first_name ?? 'SubBee User';
  const startParam = ctx.match; // Deep link connection param (e.g. conn_USER_UUID)

  try {
    // ── Deep Linking Connection Flow ─────────────────────────────────────────
    if (startParam && startParam.startsWith('conn_')) {
      const userId = startParam.replace('conn_', '');

      // Check if user exists by UUID
      const userRes = await db.query('SELECT id, email FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        // Unlink Telegram Chat ID from any previous profile to avoid UNIQUE constraint violations
        await db.query('UPDATE users SET telegram_chat_id = NULL WHERE telegram_chat_id = $1', [telegramChatId]);
        
        // Link Telegram Chat ID to the existing web profile
        await db.query(
          'UPDATE users SET telegram_chat_id = $1 WHERE id = $2',
          [telegramChatId, userId]
        );
        await ctx.reply(
          `✅ *Telegram Connected!*\n\n` +
          `Your Telegram account has been linked to your SubBee wallet profile (*${userRes.rows[0].email}*).\n\n` +
          `You will now receive real-time notifications for deposits, virtual card funding, and billing renewals here.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
    }

    // ── Standard Onboarding Flow ──────────────────────────────────────────────
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

      // Initialize ledger accounts
      await db.query(
        "INSERT INTO ledger_accounts (user_id, type, currency, current_balance) VALUES ($1, 'wallet', 'NGN', 0)",
        [userId]
      );
      await db.query(
        "INSERT INTO ledger_accounts (user_id, type, currency, current_balance) VALUES ($1, 'card', 'NGN', 0)",
        [userId]
      );
      await db.query(
        "INSERT INTO ledger_accounts (user_id, type, currency, current_balance) VALUES ($1, 'card_pending', 'NGN', 0)",
        [userId]
      );
    } else {
      userId = userResult.rows[0].id;
    }

    // 2. Check if user already has a virtual account
    const accountResult = await db.query('SELECT bank_account_number, bank_name FROM virtual_accounts WHERE user_id = $1', [userId]);

    let bankAccount: string;
    let bankName: string;

    if (accountResult.rowCount === 0) {
      const accountName = `SubBee - ${username || firstName}`;
      const nombaAccount = await createNombaVirtualAccount({
        accountRef: userId,
        accountName,
      });

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
    const userResult = await db.query('SELECT id FROM users WHERE telegram_chat_id = $1', [telegramChatId]);
    if (userResult.rows.length === 0) {
      await ctx.reply('⚠️ You do not have a SubBee account yet. Run /start to set one up!');
      return;
    }
    const userId = userResult.rows[0].id;

    // Fetch wallet balance
    const walletResult = await db.query(
      "SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'",
      [userId]
    );

    // Fetch card balance
    const cardResult = await db.query(
      "SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'card'",
      [userId]
    );

    const balanceKobo = walletResult.rows.length > 0 ? BigInt(walletResult.rows[0].current_balance) : 0n;
    const cardKobo = cardResult.rows.length > 0 ? BigInt(cardResult.rows[0].current_balance) : 0n;

    const balanceNaira = (Number(balanceKobo) / 100).toFixed(2);
    const cardNaira = (Number(cardKobo) / 100).toFixed(2);

    await ctx.reply(
      `🐝 *SubBee Balance Overview:*\n\n` +
      `💳 *Wallet Balance:* ₦${balanceNaira}\n` +
      `🛍️ *Virtual Card Balance:* ₦${cardNaira}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('[telegram/bot] Balance query error:', error);
    await ctx.reply('⚠️ Error fetching wallet balance. Please try again.');
  }
});

/**
 * Display or lazy-issue virtual card details
 */
bot.command('card', async (ctx) => {
  const telegramChatId = String(ctx.chat.id);

  try {
    // 1. Resolve user
    const userRes = await db.query('SELECT id, kyc_status FROM users WHERE telegram_chat_id = $1', [telegramChatId]);
    if (userRes.rowCount === 0) {
      await ctx.reply('⚠️ You do not have a SubBee account yet. Run /start to set one up!');
      return;
    }
    const user = userRes.rows[0];

    // 2. Enforce KYC onboarding on frontend
    if (user.kyc_status !== 'verified') {
      await ctx.reply(
        `👤 *KYC Verification Required!*\n\n` +
        `Bridgecard requires KYC documentation to issue virtual cards.\n\n` +
        `Please log in to the SubBee Web Dashboard at http://localhost:5173 to complete your verification wizard.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // 3. Fetch cardholder and card details
    const chRes = await db.query('SELECT id, bridgecard_cardholder_id FROM cardholders WHERE user_id = $1', [user.id]);
    const cardholder = chRes.rows[0];

    let cardRes = await db.query('SELECT * FROM cards WHERE user_id = $1', [user.id]);
    let card: any;

    if (cardRes.rowCount === 0) {
      // Lazy-issue card via Bridgecard API client
      await ctx.reply('⏳ Creating your virtual Naira MasterCard...');
      const cardData = await bridgecard.createVirtualCard(cardholder.bridgecard_cardholder_id);

      const insertRes = await db.query(
        'INSERT INTO cards (user_id, cardholder_id, bridgecard_card_id, last4, brand, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user.id, cardholder.id, cardData.cardId, cardData.last4, cardData.brand, cardData.status]
      );
      card = insertRes.rows[0];
    } else {
      card = cardRes.rows[0];
    }

    // Get current card balance from ledger
    const balanceRes = await db.query(
      "SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'card'",
      [user.id]
    );
    const balanceNaira = (Number(balanceRes.rows[0]?.current_balance ?? 0) / 100).toFixed(2);

    await ctx.reply(
      `💳 *Your SubBee Virtual Card:*\n\n` +
      `• *Brand:* ${card.brand.toUpperCase()}\n` +
      `• *Number:* \`•••• •••• •••• ${card.last4}\`\n` +
      `• *Status:* ${card.status.toUpperCase()}\n` +
      `• *Card Balance:* ₦${balanceNaira}\n\n` +
      `💡 *To fund this card:* Send \`/fund_card <amount>\` (e.g. \`/fund_card 2500\`) to move money from your SubBee wallet balance to your card.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('[telegram/bot] Card command error:', error);
    await ctx.reply('⚠️ Error loading virtual card. Please try again.');
  }
});

/**
 * Initiate virtual card funding
 */
bot.command('fund_card', async (ctx) => {
  const telegramChatId = String(ctx.chat.id);
  const amountParam = ctx.match?.trim();

  if (!amountParam) {
    await ctx.reply('💡 *Usage:* `/fund_card <amount>` (e.g. `/fund_card 5000`)', { parse_mode: 'Markdown' });
    return;
  }

  const amountNaira = parseFloat(amountParam);
  if (isNaN(amountNaira) || amountNaira <= 0) {
    await ctx.reply('⚠️ Please provide a valid positive transfer amount.');
    return;
  }

  const amountKobo = Math.round(amountNaira * 100);

  try {
    // 1. Resolve user
    const userRes = await db.query('SELECT id FROM users WHERE telegram_chat_id = $1', [telegramChatId]);
    if (userRes.rowCount === 0) {
      await ctx.reply('⚠️ You do not have a SubBee account yet. Run /start to set one up!');
      return;
    }
    const user = userRes.rows[0];

    // 2. Fund virtual card using shared service
    await fundVirtualCard(user.id, amountKobo);

    await ctx.reply(
      `⏳ *Funding Request Sent!*\n\n` +
      `We have queued a transfer of ₦${amountNaira.toFixed(2)} to your virtual card.\n` +
      `Your card balance will be updated automatically once settled by the network in a few seconds.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error: any) {
    console.error('[telegram/bot] Fund card error:', error);
    await ctx.reply(`⚠️ ${error.message || 'Sorry, there was an error processing your card funding request.'}`);
  }
});

/**
 * Catch-all for natural language AI processing
 */
bot.on('message:text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return; // Ignore explicit commands

  const telegramChatId = String(ctx.chat.id);
  const userMessage = ctx.message.text;

  // Send a typing indicator
  await ctx.replyWithChatAction('typing');

  try {
    // 1. Resolve User
    const userRes = await db.query('SELECT id, email FROM users WHERE telegram_chat_id = $1', [telegramChatId]);
    if (userRes.rowCount === 0) {
      await ctx.reply('⚠️ You do not have a SubBee account yet. Run /start to set one up!');
      return;
    }
    const user = userRes.rows[0];

    // 2. Fetch context data
    const walletRes = await db.query("SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'wallet'", [user.id]);
    const cardRes = await db.query("SELECT current_balance FROM ledger_accounts WHERE user_id = $1 AND type = 'card'", [user.id]);
    const vaRes = await db.query("SELECT bank_account_number, bank_name FROM virtual_accounts WHERE user_id = $1", [user.id]);
    const subsRes = await db.query("SELECT merchant_name, amount_kobo, billing_day, is_active FROM subscriptions WHERE user_id = $1", [user.id]);

    const walletBalanceNaira = (Number(walletRes.rows[0]?.current_balance || 0) / 100).toFixed(2);
    const virtualCardBalanceNaira = (Number(cardRes.rows[0]?.current_balance || 0) / 100).toFixed(2);
    
    const subscriptions = subsRes.rows.map(s => ({
      merchant: s.merchant_name,
      amount: (Number(s.amount_kobo) / 100).toFixed(2),
      billingDay: s.billing_day,
      status: s.is_active ? 'Active' : 'Paused'
    }));

    const contextData: UserContext = {
      firstName: ctx.from.first_name || 'User',
      email: user.email,
      walletBalanceNaira,
      virtualCardBalanceNaira,
      bankAccount: vaRes.rows[0]?.bank_account_number || null,
      bankName: vaRes.rows[0]?.bank_name || null,
      subscriptions
    };

    // 3. Process via Gemini
    const aiResponse = await processNaturalLanguageCommand(userMessage, contextData);

    // 4. Reply
    await ctx.reply(aiResponse, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('[telegram/bot] Error processing AI message:', err);
    await ctx.reply("Bzzzt! My connection to the hive dropped. Try again later!");
  }
});

// Start the bot using long polling in local/dev environments
if (config.NODE_ENV !== 'test') {
  bot.start({
    onStart: (info) => {
      console.log(`[telegram/bot] Bot @${info.username} started successfully.`);
    },
  });

  // Enable graceful stop for nodemon reloads
  const stopBot = async () => {
    try { await bot.stop(); } catch (e) {}
    process.exit(0);
  };
  process.once('SIGINT', stopBot);
  process.once('SIGTERM', stopBot);
  process.once('SIGUSR2', stopBot);
}
