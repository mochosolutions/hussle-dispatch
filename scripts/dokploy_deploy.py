#!/usr/bin/env python3
"""
Trigger a Dokploy compose application redeploy.

Reads from environment variables:
  DOKPLOY_URL              Base URL of Dokploy instance (e.g. https://dokploy.fleet.hussledispatch.com)
  DOKPLOY_API_TOKEN        Bearer token for Dokploy API
  DOKPLOY_APPLICATION_ID   ID of the compose application to redeploy

Retries on 5xx responses with exponential backoff (3 attempts).
Exits 0 on success (2xx), non-zero on failure.
"""

import json
import logging
import os
import sys
import time
import urllib.error
import urllib.request

logging.basicConfig(format='%(asctime)s %(levelname)s %(message)s', level=logging.INFO)

MAX_ATTEMPTS = 3
RETRY_DELAYS = [5, 10]


def get_required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        logging.error('Missing required environment variable: %s', name)
        sys.exit(1)
    return value


def redeploy(dokploy_url: str, api_token: str, application_id: str) -> None:
    url = f'{dokploy_url}/api/compose.redeploy'
    payload = json.dumps({'composeId': application_id}).encode('utf-8')
    headers = {
        'Authorization': f'Bearer {api_token}',
        'Content-Type': 'application/json',
    }

    req = urllib.request.Request(url, data=payload, headers=headers, method='POST')

    for attempt in range(1, MAX_ATTEMPTS + 1):
        logging.info('Triggering redeploy (attempt %d/%d): %s', attempt, MAX_ATTEMPTS, url)
        try:
            with urllib.request.urlopen(req) as response:
                status = response.status
                body = response.read().decode('utf-8')
                logging.info('Redeploy triggered successfully (HTTP %d): %s', status, body)
                return
        except urllib.error.HTTPError as err:
            status = err.code
            body = err.read().decode('utf-8')
            if 400 <= status < 500:
                logging.error('Client error (HTTP %d) — not retrying: %s', status, body)
                sys.exit(1)
            if attempt < MAX_ATTEMPTS:
                delay = RETRY_DELAYS[attempt - 1]
                logging.warning('Server error (HTTP %d), retrying in %ds: %s', status, delay, body)
                time.sleep(delay)
            else:
                logging.error('Server error (HTTP %d) after %d attempts: %s', status, MAX_ATTEMPTS, body)
                sys.exit(1)
        except urllib.error.URLError as err:
            logging.error('Connection error: %s', err.reason)
            sys.exit(1)


def main() -> None:
    dokploy_url = get_required_env('DOKPLOY_URL').rstrip('/')
    api_token = get_required_env('DOKPLOY_API_TOKEN')
    application_id = get_required_env('DOKPLOY_APPLICATION_ID')

    logging.info('Deploying compose application: %s', application_id)
    redeploy(dokploy_url, api_token, application_id)


if __name__ == '__main__':
    main()
