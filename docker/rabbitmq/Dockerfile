FROM rabbitmq:3.13-management

ARG PLUGIN_VERSION=3.13.0
ARG PLUGIN_URL=https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v${PLUGIN_VERSION}/rabbitmq_delayed_message_exchange-${PLUGIN_VERSION}.ez

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fSL -o /opt/rabbitmq/plugins/rabbitmq_delayed_message_exchange.ez "${PLUGIN_URL}" \
 && apt-get purge -y --auto-remove curl \
 && rm -rf /var/lib/apt/lists/*

RUN rabbitmq-plugins enable --offline rabbitmq_delayed_message_exchange
