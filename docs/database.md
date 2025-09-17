# Database

This document describes how to manage the PostgreSQL database for the Epic Stack
application.

## Connection Management

The Epic Stack uses PostgreSQL as its primary database. The database connection
is managed through the `DATABASE_URL` environment variable.

## Connecting to your production database

To connect to your production database, you'll need the connection string from
your hosting provider. Most PostgreSQL hosting services provide tools for
database management:

- **Direct connection**: Use `psql` or any PostgreSQL client with your
  connection string
- **Web interfaces**: Many providers offer web-based database management tools
- **SSH tunneling**: Some providers allow SSH access for secure connections

### Using Prisma Studio

Prisma Studio provides a visual interface for your database. To use it in
production:

1. Set up an SSH tunnel to your production server (if required by your hosting
   provider)
2. Set the `DATABASE_URL` environment variable to your production database URL
3. Run `npx prisma studio`

## Database Migrations

The Epic Stack uses Prisma for database migrations. Key commands:

- `npx prisma migrate dev`: Create a new migration during development
- `npx prisma migrate deploy`: Apply migrations in production
- `npx prisma migrate reset`: Reset the database (WARNING: This deletes all
  data)

## Database Backup and Restore

### Creating Backups

PostgreSQL provides several backup methods:

```bash
# Using pg_dump for a complete backup
pg_dump $DATABASE_URL > backup-$(date +%Y-%m-%d).sql

# Using pg_dump with compression
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y-%m-%d).sql.gz
```

### Restoring from Backup

To restore a database from backup:

```bash
# Restore from SQL file
psql $DATABASE_URL < backup.sql

# Restore from compressed file
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

## Seeding Production

To seed your production database:

1. Ensure your `prisma/seed.ts` file is configured appropriately for production
2. Run the seed command:
   ```bash
   npx prisma db seed
   ```

**WARNING**: Be careful when seeding production databases. The default seed file
may create test data that you don't want in production.

## Database Monitoring

Consider implementing monitoring for your PostgreSQL database:

- Query performance monitoring
- Connection pool monitoring
- Storage usage tracking
- Automated backup verification

## Best Practices

1. **Regular Backups**: Set up automated backups with your hosting provider
2. **Connection Pooling**: Use connection pooling for better performance
3. **Security**: Use SSL connections and strong passwords
4. **Monitoring**: Set up alerts for database issues
5. **Testing**: Always test migrations in a staging environment first
