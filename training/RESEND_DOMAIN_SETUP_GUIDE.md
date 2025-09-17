# Resend Email Domain Configuration Guide

## Setting up annexdigitalinc.com for Email Sending

### Overview

To send emails through Resend using your domain (annexdigitalinc.com), you need
to verify domain ownership by adding DNS records. This is a security measure to
prevent email spoofing.

---

## Step 1: Add Domain to Resend

1. **Login to Resend Dashboard**
   - Go to https://resend.com/domains
   - Use the account associated with the API key

2. **Add Your Domain**
   - Click "Add Domain"
   - Enter: `annexdigitalinc.com`
   - Click "Add"

3. **Resend Will Provide DNS Records**
   - You'll see a page with DNS records to add
   - Keep this page open (you'll need these values)

---

## Step 2: DNS Records You Need to Add

Resend will typically ask you to add these DNS records to annexdigitalinc.com:

### A. Domain Verification (TXT Record)

```
Type: TXT
Name: resend._domainkey
Value: [Resend will provide a long string like "v=DKIM1; k=rsa; p=MIGfMA0..."]
TTL: 3600 (or default)
```

### B. SPF Record (TXT Record)

```
Type: TXT
Name: @ (or leave blank for root domain)
Value: "v=spf1 include:_spf.resend.com ~all"
TTL: 3600
```

**Note**: If you already have an SPF record, modify it to include Resend:

```
"v=spf1 include:_spf.resend.com include:yourother.provider.com ~all"
```

### C. DKIM Records (CNAME Records)

Resend will provide 2-3 CNAME records:

```
Type: CNAME
Name: resend._domainkey
Value: [something].resend.com
TTL: 3600
```

```
Type: CNAME
Name: resend1._domainkey
Value: [something].resend.com
TTL: 3600
```

```
Type: CNAME
Name: resend2._domainkey
Value: [something].resend.com
TTL: 3600
```

---

## Step 3: Add DNS Records to Your Domain

### If Using Popular DNS Providers:

#### **GoDaddy**

1. Login to GoDaddy
2. Go to "My Products" → "Domain" → "DNS"
3. Click "Add" for each record
4. Enter the values from Resend

#### **Cloudflare**

1. Login to Cloudflare
2. Select your domain
3. Go to "DNS" tab
4. Click "Add record"
5. Add each record from Resend
6. **Important**: For CNAME records, disable "Proxy" (click orange cloud to make
   it grey)

#### **Namecheap**

1. Login to Namecheap
2. Go to "Domain List" → "Manage"
3. Go to "Advanced DNS"
4. Add new records with Resend values

#### **AWS Route 53**

1. Go to Route 53 console
2. Select your hosted zone
3. Click "Create Record"
4. Add each record type

---

## Step 4: Verify Domain in Resend

1. **After adding DNS records, wait 5-30 minutes**
   - DNS propagation takes time
   - SPF/TXT records usually propagate faster
   - CNAME records might take longer

2. **In Resend Dashboard**
   - Go back to your domain settings
   - Click "Verify DNS Records" or "Check Status"
   - You should see green checkmarks when verified

3. **Troubleshooting Verification**
   - Use DNS checker: https://dnschecker.org
   - Enter your domain with the record name
   - Example: `resend._domainkey.annexdigitalinc.com`
   - Verify the records are visible globally

---

## Step 5: Update Your Code

Once domain is verified, update the Epic Stack code:

### In `app/utils/email.server.ts`:

```typescript
// Line 35 - Change from:
const from = 'joey.castillo@annexdigitalinc.com'

// To any of these options:
const from = 'noreply@annexdigitalinc.com' // Generic no-reply
const from = 'hello@annexdigitalinc.com' // Friendly sender
const from = 'support@annexdigitalinc.com' // Support address
const from = 'notifications@annexdigitalinc.com' // System notifications

// Or make it configurable via environment variable:
const from = process.env.EMAIL_FROM || 'noreply@annexdigitalinc.com'
```

**Note**: You can use ANY email address @annexdigitalinc.com once the domain is
verified. The email address doesn't need to actually exist as a mailbox.

---

## Step 6: Test Email Sending

### Quick Test Script

Create `test-email.js` in your project root:

```javascript
async function testEmail() {
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: 'Bearer re_FLkbHQq2_C3jfbzLQa6Z3JTJ3n1HHsaCW',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: 'test@annexdigitalinc.com',
			to: 'your-test-email@gmail.com', // Change this
			subject: 'Test Email from Resend',
			html: '<p>This is a test email from Epic Stack!</p>',
		}),
	})

	const data = await response.json()
	console.log('Response:', data)
}

testEmail()
```

Run with: `node test-email.js`

### Test in Epic Stack

1. Start the application: `npm run dev`
2. Test password reset:
   - Go to `/forgot-password`
   - Enter your email
   - Check inbox
3. Check console for any error messages

---

## Common Issues & Solutions

### Issue 1: "Domain not verified"

**Solution**:

- Check DNS records are exactly as Resend provided
- Wait for DNS propagation (up to 48 hours in rare cases)
- No typos in DNS record values

### Issue 2: "Invalid from address"

**Solution**:

- Domain must be verified first
- Use an address @annexdigitalinc.com
- Don't use personal domains unless verified

### Issue 3: Emails sent but not received

**Check**:

- Spam/junk folders
- Email might be delayed (check Resend dashboard for status)
- Verify SPF/DKIM records are correct

### Issue 4: "Authentication failed"

**Solution**:

- Verify API key is correct
- Check if API key has sending permissions
- Ensure no extra spaces in API key

---

## Alternative: Use Resend's Domain

If you can't modify DNS records for annexdigitalinc.com, you have options:

### Option 1: Use Resend's Test Domain (Development Only)

```typescript
const from = 'onboarding@resend.dev' // Works immediately, no setup needed
```

**Limitation**: Only works with Resend's test API keys in development

### Option 2: Use a Subdomain

Instead of verifying `annexdigitalinc.com`, verify a subdomain:

- Add subdomain: `mail.annexdigitalinc.com`
- Only need DNS records for the subdomain
- Use: `noreply@mail.annexdigitalinc.com`

### Option 3: Use Personal Domain

If you have another domain with DNS access:

- Add that domain to Resend
- Verify it
- Use it temporarily for development

---

## Security Best Practices

1. **Never use personal email addresses as "from"**
   - Use role-based addresses (noreply@, support@, etc.)

2. **Set up DMARC (Optional but recommended)**

   ```
   Type: TXT
   Name: _dmarc
   Value: "v=DMARC1; p=none; rua=mailto:dmarc@annexdigitalinc.com"
   ```

3. **Monitor email reputation**
   - Check Resend dashboard for bounce rates
   - Monitor spam complaints

4. **Rate limiting**
   - Resend has built-in rate limits
   - Add application-level rate limiting for password resets

---

## FAQ

### Q: Do I need an actual email server for annexdigitalinc.com?

**A**: No! Resend acts as your email server. You only need to verify domain
ownership via DNS.

### Q: Can I receive replies to these emails?

**A**: Not by default. These are send-only addresses. To receive replies:

- Set up email forwarding (some DNS providers offer this)
- Use a different service for receiving emails
- Set Reply-To header to a real mailbox

### Q: How long does verification take?

**A**: Usually 5-30 minutes, but can take up to 48 hours depending on DNS
provider.

### Q: Can I use multiple from addresses?

**A**: Yes! Once the domain is verified, use any address @annexdigitalinc.com

### Q: What if I don't have DNS access?

**A**: You need DNS access to verify. Ask your domain administrator or use a
different domain.

---

## Next Steps

1. ✅ Add domain to Resend dashboard
2. ✅ Add DNS records to your domain provider
3. ✅ Wait for verification
4. ✅ Update code with verified domain
5. ✅ Test email sending
6. ✅ Deploy with confidence!

---

## Support Resources

- **Resend Documentation**: https://resend.com/docs
- **DNS Propagation Checker**: https://dnschecker.org
- **SPF Record Checker**: https://mxtoolbox.com/spf.aspx
- **Resend Status Page**: https://status.resend.com

---

_Note: DNS changes affect email delivery globally. Always test thoroughly before
deploying to production._
