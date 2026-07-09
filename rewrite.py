import subprocess
import sys

def run(cmd):
    print("Running:", cmd)
    try:
        output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
        return output.decode('utf-8')
    except subprocess.CalledProcessError as e:
        print("Command failed:", e.output.decode('utf-8'))
        sys.exit(1)

def run_safe(cmd):
    print("Running (safe):", cmd)
    try:
        subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError:
        pass

def main():
    commits = run("git log --format=%H -n 4").strip().split('\n')
    commits.reverse()
    
    base_commit = commits[0]
    run(f"git reset --hard {base_commit}^")
    
    for commit in commits:
        run_safe(f"git cherry-pick {commit} -n")
        
        msg = run(f"git log --format=%B -n 1 {commit}").strip()
        
        if "shrunk images" in msg:
            run_safe("git rm --cached apps/frontend/optimize-images.js")
            
        if "feat(frontend): setup pwa" in msg:
            run_safe("git rm --cached apps/frontend/generate-icons.js")
            run_safe("git reset HEAD apps/frontend/src/components/ui/ProgressBar.tsx")
            run_safe("git checkout HEAD apps/frontend/src/components/ui/ProgressBar.tsx")
            
        run(f"git commit -C {commit}")
        
    run("git push -f")

if __name__ == '__main__':
    main()
