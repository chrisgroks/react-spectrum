# Use Ubuntu 24.04 as base
FROM ubuntu:24.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=22

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    python3 \
    make \
    g++ \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Enable Corepack for Yarn
RUN corepack enable

# Verify installations
RUN node --version && npm --version && yarn --version

# Set working directory (Cloud Agents will manage the actual workspace)
WORKDIR /workspace

# Don't COPY the project - Cloud Agents manages this

