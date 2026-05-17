resource "cloudflare_zone" "this" {
  account_id = var.cloudflare_account_id
  zone       = var.domain_name
  type       = "full"
}

resource "cloudflare_record" "service" {
  for_each = var.service_subdomains

  zone_id = cloudflare_zone.this.id
  name    = each.value
  value   = local.server_ip
  type    = "A"
  proxied = true
  ttl     = 1
}

# ---------------------------------------------------------------------------
# SES DNS records
# ---------------------------------------------------------------------------

resource "cloudflare_record" "ses_verification" {
  zone_id = cloudflare_zone.this.id
  name    = "_amazonses.notify.${var.domain_name}"
  value   = aws_ses_domain_identity.notify.verification_token
  type    = "TXT"
  ttl     = 3600
}

resource "cloudflare_record" "ses_dkim" {
  count   = 3
  zone_id = cloudflare_zone.this.id
  name    = "${aws_ses_domain_dkim.notify.dkim_tokens[count.index]}._domainkey.notify.${var.domain_name}"
  value   = "${aws_ses_domain_dkim.notify.dkim_tokens[count.index]}.dkim.amazonses.com"
  type    = "CNAME"
  ttl     = 3600
}

resource "cloudflare_record" "ses_mail_from_mx" {
  zone_id  = cloudflare_zone.this.id
  name     = "mail.notify.${var.domain_name}"
  value    = "feedback-smtp.${var.aws_region}.amazonses.com"
  type     = "MX"
  priority = 10
  ttl      = 3600
}

resource "cloudflare_record" "ses_mail_from_spf" {
  zone_id = cloudflare_zone.this.id
  name    = "mail.notify.${var.domain_name}"
  value   = "v=spf1 include:amazonses.com -all"
  type    = "TXT"
  ttl     = 3600
}

resource "cloudflare_record" "ses_send_spf" {
  zone_id = cloudflare_zone.this.id
  name    = "notify.${var.domain_name}"
  value   = "v=spf1 include:amazonses.com -all"
  type    = "TXT"
  ttl     = 3600
}

resource "cloudflare_record" "ses_dmarc" {
  zone_id = cloudflare_zone.this.id
  name    = "_dmarc.notify.${var.domain_name}"
  value   = "v=DMARC1; p=quarantine; rua=mailto:dmarc@${var.domain_name}; adkim=s; aspf=s"
  type    = "TXT"
  ttl     = 3600
}
