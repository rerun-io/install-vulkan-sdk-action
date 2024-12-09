FROM node:21-bookworm-slim

# Switch to non-interactive mode for apt-get
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends apt-utils dialog 2>&1 && \
    apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl wget gnupg dirmngr xz-utils mc git && \
	  # install node, yarn, npm
    npm install -g n@latest && \
    npm install -g yarn@latest --force && \
    npm install -g npm@latest && \
	  # cleanup
    apt-get autoremove -y && \
    apt-get clean autoclean && \
	  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install act (GitHub Actions local runner. See also https://github.com/nektos/act)
# 'act' doesn't work on devcontainer. It works locally and on WSL.
# RUN curl https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Switch back to dialog for any ad-hoc use of apt-get
ENV DEBIAN_FRONTEND=dialog

COPY docker-entrypoint.sh /usr/local/bin/

ENTRYPOINT ["docker-entrypoint.sh"]

CMD [ "node" ]
