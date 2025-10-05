-- Updated database schema for Parkering.no
-- This includes password_hash field for user authentication

-- Drop existing tables if they exist (for clean setup)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[messages]') AND type in (N'U'))
    DROP TABLE [dbo].[messages];

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[bookings]') AND type in (N'U'))
    DROP TABLE [dbo].[bookings];

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[listings]') AND type in (N'U'))
    DROP TABLE [dbo].[listings];

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
    DROP TABLE [dbo].[users];

-- Users table with password authentication
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Parking listings
CREATE TABLE listings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    host_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
    title NVARCHAR(255) NOT NULL,
    location NVARCHAR(500) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features NVARCHAR(MAX), -- JSON string of features array
    image_url NVARCHAR(500),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Bookings
CREATE TABLE bookings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    listing_id UNIQUEIDENTIFIER REFERENCES listings(id) ON DELETE CASCADE,
    user_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status NVARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Messages
CREATE TABLE messages (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    booking_id UNIQUEIDENTIFIER REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE CASCADE,
    message NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Indexes for performance
CREATE INDEX IX_users_email ON users(email);
CREATE INDEX IX_listings_location ON listings(location);
CREATE INDEX IX_listings_price ON listings(price);
CREATE INDEX IX_listings_host_id ON listings(host_id);
CREATE INDEX IX_listings_is_active ON listings(is_active);
CREATE INDEX IX_bookings_user_id ON bookings(user_id);
CREATE INDEX IX_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IX_bookings_status ON bookings(status);
CREATE INDEX IX_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IX_messages_booking_id ON messages(booking_id);
CREATE INDEX IX_messages_sender_id ON messages(sender_id);

-- Insert some sample data for testing
INSERT INTO users (name, email, password_hash) VALUES 
('Test Bruker', 'test@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2'), -- password: test123
('Eugen Nygaard', 'eugen.nygaard@orizzontes.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2'); -- password: test123

-- Get the user IDs for sample data
DECLARE @test_user_id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'test@example.com');
DECLARE @eugen_user_id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'eugen.nygaard@orizzontes.com');

-- Insert sample listings
INSERT INTO listings (host_id, title, location, price, features, image_url, is_active) VALUES 
(@test_user_id, 'Sentrumsparkering Oslo', 'Oslo Sentrum, Norge', 150.00, '["Overdekket", "Sikker", "Nær kollektivtransport"]', 'https://example.com/parking1.jpg', 1),
(@test_user_id, 'Hjemmeparkering Bergen', 'Bergen Sentrum, Norge', 120.00, '["Overdekket", "Elektrisk lading"]', 'https://example.com/parking2.jpg', 1),
(@eugen_user_id, 'Garageplass Trondheim', 'Trondheim Sentrum, Norge', 100.00, '["Overdekket", "Sikker", "24/7 tilgang"]', 'https://example.com/parking3.jpg', 1);

PRINT 'Database schema created successfully with sample data!';
PRINT 'Sample users created:';
PRINT '- test@example.com (password: test123)';
PRINT '- eugen.nygaard@orizzontes.com (password: test123)';
PRINT 'Sample parking listings created for testing.';
