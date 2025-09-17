# Deployment

The Epic Stack is designed to be deployed to various platforms. This application
uses PostgreSQL as the database, which can be hosted on any
PostgreSQL-compatible service.

## Prerequisites

Before deploying, ensure you have:

1. A PostgreSQL database instance
2. Environment variables configured (see `.env.example`)
3. A hosting platform that supports Node.js applications

## Environment Variables

Set the following environment variables in your deployment environment:

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `HONEYPOT_SECRET`: A secure random string for form protection
- `RESEND_API_KEY`: Your Resend API key for email services
- `SENTRY_DSN`: (Optional) Sentry DSN for error monitoring
- `ALLOW_INDEXING`: Set to `false` for staging environments to prevent search
  engine indexing

For S3-compatible object storage:

- `AWS_ACCESS_KEY_ID`: Access key for S3-compatible storage
- `AWS_SECRET_ACCESS_KEY`: Secret key for S3-compatible storage
- `AWS_REGION`: Region for S3-compatible storage
- `AWS_ENDPOINT_URL_S3`: Endpoint URL for S3-compatible storage
- `BUCKET_NAME`: Name of your storage bucket

## Docker Deployment

The application includes a Dockerfile for containerized deployments:

```bash
# Build the Docker image
docker build -t epic-stack . -f other/Dockerfile --build-arg COMMIT_SHA=`git rev-parse --short HEAD`

# Run the container
docker run -d -p 8080:8080 \
  -e DATABASE_URL='your-postgresql-url' \
  -e SESSION_SECRET='your-session-secret' \
  -e HONEYPOT_SECRET='your-honeypot-secret' \
  epic-stack
```

## Database Setup

Before running the application, ensure your PostgreSQL database is set up:

```bash
# Run migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

## Optional Services

### Email Service

The application uses Resend for sending emails. See [the email docs](./email.md)
for setup instructions.

### Error Monitoring

For production error tracking, see [the monitoring docs](./monitoring.md).

### Database Management

For connecting to your production database, see
[the database docs](./database.md).
