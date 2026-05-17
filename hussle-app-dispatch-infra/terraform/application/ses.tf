# ---------------------------------------------------------------------------
# SES — Domain Identity, DKIM, and Custom MAIL FROM
# ---------------------------------------------------------------------------

locals {
  ses_send_domain = "notify.${var.domain_name}"
  ses_mail_from   = "mail.notify.${var.domain_name}"
}

# Domain identity for sending email
resource "aws_ses_domain_identity" "notify" {
  domain = local.ses_send_domain
}

# DKIM signing for the send domain
resource "aws_ses_domain_dkim" "notify" {
  domain = aws_ses_domain_identity.notify.domain
}

# Custom MAIL FROM domain (improves deliverability)
resource "aws_ses_domain_mail_from" "notify" {
  domain           = aws_ses_domain_identity.notify.domain
  mail_from_domain = local.ses_mail_from
}

# ---------------------------------------------------------------------------
# Outputs — DNS records to add manually after `terraform apply`
# ---------------------------------------------------------------------------

output "ses_verification_token" {
  description = "TXT record value for SES domain verification (_amazonses.notify.<domain>)"
  value       = aws_ses_domain_identity.notify.verification_token
}

output "ses_dkim_tokens" {
  description = "CNAME records for DKIM signing (3 entries: <token>._domainkey.notify.<domain> -> <token>.dkim.amazonses.com)"
  value       = aws_ses_domain_dkim.notify.dkim_tokens
}

output "ses_send_domain" {
  description = "The verified subdomain used for sending email"
  value       = local.ses_send_domain
}

output "ses_mail_from_domain" {
  description = "Custom MAIL FROM domain — add MX record (feedback-smtp.<region>.amazonses.com, priority 10) and SPF TXT record"
  value       = local.ses_mail_from
}

output "ses_recommended_from" {
  description = "Recommended FROM address for invoice emails"
  value       = "invoices@${local.ses_send_domain}"
}
