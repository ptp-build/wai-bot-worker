# Wai Bot Worker

Wai Bot Worker by electron

###  - 发布


- change `package.json` > `version` to `1.0.1`


    VERSION=1.1.3
    git add . && git commit -m "Version ${VERSION} release"
    git tag -a v${VERSION} -m "Version ${VERSION} release"
    git push origin v${VERSION}
    git tag --list
