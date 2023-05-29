FROM debian:buster-slim

# Install packages
RUN apt-get update && apt-get install -y \
    apt-utils \
    curl \
    git \
    gnupg \
    lsb-release \
    sudo \
    unzip \
    wget \
    zip \
    wget

# Install NodeJS
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
RUN apt-get install -y nodejs

# Change working directory
RUN mkdir -p /workspace/markov-bot
WORKDIR /workspace/markov-bot

# Git Clone of Markov-Bot Repo
RUN cd /workspace/markov-bot && git clone https://github.com/knownasbot/markov-bot.git .

# Install Markov-Bot
RUN cd /workspace/markov-bot/ && npm install

# Run Markov-Bot Build
RUN cd /workspace/markov-bot/ && npm run build

# Run Markov-Bot
CMD ["npm", "run", "start"]