import sys
import re
import argparse

def strip_ansi(text):
    return re.sub(r'\x1b\[[0-9;]*[mGKF]', '', text)

def filter_git_status(lines):
    filtered = []
    current_section = None
    for line in lines:
        line = strip_ansi(line).strip()
        if not line: continue
        
        # Skip hints
        if line.startswith("(use \"git"): continue
        
        if "Changes to be committed:" in line:
            filtered.append("### Staged:")
            current_section = "staged"
        elif "Changes not staged for commit:" in line:
            filtered.append("### Modified:")
            current_section = "modified"
        elif "Untracked files:" in line:
            filtered.append("### Untracked:")
            current_section = "untracked"
        elif line.startswith("modified:") or line.startswith("new file:") or line.startswith("deleted:"):
            filtered.append(f"  {line}")
        elif current_section == "untracked" and not line.startswith("nothing to commit"):
            filtered.append(f"  {line}")
        elif "Your branch is up to date" in line:
            filtered.append("Branch: OK")
    
    if not filtered:
        return "git status: clean"
    return "\n".join(filtered)

def filter_turbo(lines):
    patterns = [
        r'^\s*$',
        r'^\s*cache (hit|miss|bypass)',
        r'^\s*\d+ packages in scope',
        r'^\s*Tasks:\s+\d+',
        r'^\s*Duration:\s+',
        r'^\s*Remote caching (enabled|disabled)',
        r'^.*cache hit, replaying logs.*$'
    ]
    filtered = []
    for line in lines:
        if not any(re.search(p, line, re.IGNORECASE) for p in patterns):
            filtered.append(line)
    return "\n".join(filtered) if filtered else "turbo: ok"

def filter_nx(lines):
    patterns = [
        r'^\s*$',
        r'^\s*>\s*NX\s+Running target',
        r'^\s*>\s*NX\s+Nx read the output',
        r'^\s*>\s*NX\s+View logs',
        r'^———————',
        r'^—————————',
        r'^\s+Nx \(powered by'
    ]
    filtered = []
    for line in lines:
        if not any(re.search(p, line, re.IGNORECASE) for p in patterns):
            filtered.append(line)
    return "\n".join(filtered) if filtered else "nx: ok"

def filter_npm(lines):
    patterns = [
        r'\s*$',
        r'^npm (warn|notice)',
        r'^added \d+ packages',
        r'^up to date',
        r'^found \d+ vulnerabilities',
        r'^\s*$',
        r'^>\s'
    ]
    filtered = []
    for line in lines:
        if not any(re.search(p, line, re.IGNORECASE) for p in patterns):
            filtered.append(line.rstrip())
    return "\n".join(filtered) if filtered else "npm: ok"

def filter_test_failure(lines):
    filtered = []
    in_failure = False
    failure_buffer = []
    
    for line in lines:
        line = strip_ansi(line)
        if "FAIL" in line or "FAILED" in line:
            in_failure = True
            failure_buffer.append(line.strip())
        elif in_failure:
            if "PASS" in line or "Done in" in line:
                in_failure = False
                filtered.extend(failure_buffer[:10]) # Cap failure details
                if len(failure_buffer) > 10:
                    filtered.append(f"... ({len(failure_buffer) - 10} more lines of failure)")
                failure_buffer = []
            else:
                failure_buffer.append(line.strip())
        elif "Summary" in line or "Test Suites" in line or "Tests:" in line:
            filtered.append(line.strip())
            
    if not filtered:
        return "All tests passed"
    return "\n".join(filtered)

def main():
    parser = argparse.ArgumentParser(description="RTK-inspired output filter")
    parser.add_argument("--mode", choices=["git-status", "test-failure", "turbo", "nx", "npm", "generic"], default="generic")
    args = parser.parse_args()
    
    try:
        input_text = sys.stdin.read()
    except EOFError:
        return

    lines = input_text.splitlines()
    
    if args.mode == "git-status":
        print(filter_git_status(lines))
    elif args.mode == "turbo":
        print(filter_turbo(lines))
    elif args.mode == "nx":
        print(filter_nx(lines))
    elif args.mode == "npm":
        print(filter_npm(lines))
    elif args.mode == "test-failure":
        print(filter_test_failure(lines))
    else:
        # Generic: Truncate and deduplicate
        unique_lines = []
        for line in lines:
            line = strip_ansi(line).strip()
            if line and line not in unique_lines[-5:]:
                unique_lines.append(line)
        
        if len(unique_lines) > 40:
            print("\n".join(unique_lines[:20]))
            print(f"\n... [RTK TRUNCATED {len(unique_lines) - 40} lines of noise] ...\n")
            print("\n".join(unique_lines[-20:]))
        else:
            print("\n".join(unique_lines))

if __name__ == "__main__":
    main()
