#!/bin/sh
# Local check for the F-SCO-8 gitleaks hook: clean commit passes, fake token is blocked,
# allowlisted fixture passes. The fake token is generated at run time (never stored).
set -e
command -v gitleaks >/dev/null || { echo "SKIP: gitleaks not installed"; exit 0; }
D=$(mktemp -d); cd "$D"; git init -q .; git config user.email nobody; git config user.name test
printf '[extend]\nuseDefault = true\n\n[[allowlists]]\ndescription = "fake test fixtures"\npaths = [%s^tests/fixtures/fake-secrets/%s]\n' "'''" "'''" > .gitleaks.toml
printf '#!/bin/sh\nexec gitleaks git --pre-commit --redact --staged --verbose\n' > .git/hooks/pre-commit; chmod +x .git/hooks/pre-commit
echo hi > README.md; git add .; git commit -qm clean >/dev/null 2>&1 && echo "PASS clean commit allowed"
FAKE="gh""p_$(head -c 200 /dev/urandom | tr -dc 'A-Za-z0-9' | head -c 36)"
echo "TOKEN=$FAKE" > leak.txt; git add leak.txt
if git commit -qm leak >/dev/null 2>&1; then echo "FAIL fake token was committed"; exit 1; else echo "PASS fake token blocked"; fi
mkdir -p tests/fixtures/fake-secrets; git rm -q --cached leak.txt; mv leak.txt tests/fixtures/fake-secrets/; git add tests
git commit -qm fixture >/dev/null 2>&1 && echo "PASS allowlisted fixture allowed"
rm -rf "$D"
