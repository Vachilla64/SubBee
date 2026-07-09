const { execSync } = require('child_process');

function run(cmd, allowFail = false) {
    console.log("Running:", cmd);
    try {
        return execSync(cmd, { encoding: 'utf-8' }).trim();
    } catch (e) {
        if (!allowFail) {
            console.error("Command failed:", e.stdout, e.stderr);
            process.exit(1);
        }
        return '';
    }
}

function main() {
    const commitsStr = run('git log --format=%H -n 4');
    const commits = commitsStr.split('\n').map(c => c.trim()).filter(c => c).reverse();
    
    const base_commit = commits[0];
    run(`git reset --hard ${base_commit}^`);
    
    for (const commit of commits) {
        run(`git cherry-pick ${commit} -n`, true);
        
        const msg = run(`git log --format=%B -n 1 ${commit}`);
        
        if (msg.includes("shrunk images")) {
            run("git rm --cached apps/frontend/optimize-images.js", true);
        }
        
        if (msg.includes("feat(frontend): setup pwa")) {
            run("git rm --cached apps/frontend/generate-icons.js", true);
            run("git reset HEAD apps/frontend/src/components/ui/ProgressBar.tsx", true);
            run("git checkout HEAD apps/frontend/src/components/ui/ProgressBar.tsx", true);
        }
        
        run(`git commit -C ${commit}`);
    }
    
    run("git push -f");
}

main();
