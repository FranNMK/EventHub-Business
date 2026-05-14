const { pool } = require('../config/database');

async function seedVendors() {
    try {
        // Get vendor users
        const [vendorUsers] = await pool.query("SELECT id FROM users WHERE role = 'vendor' LIMIT 6");
        
        if (vendorUsers.length === 0) {
            console.log('No vendor users found. Please create vendor accounts first.');
            process.exit(1);
        }

        const sampleVendors = [
            {
                company_name: 'Elite Catering Services',
                service_type: 'catering',
                description: 'Premium corporate catering with customizable menus. From executive lunches to gala dinners, we deliver exceptional culinary experiences.',
                contact_email: 'info@elitecatering.com',
                contact_phone: '+1 (555) 234-5678',
                website: 'www.elitecatering.com',
                address: '123 Culinary Blvd, Food District'
            },
            {
                company_name: 'ProCapture Photography',
                service_type: 'photography',
                description: 'Professional event photography and videography. We capture your corporate moments with artistic excellence.',
                contact_email: 'hello@procapture.com',
                contact_phone: '+1 (555) 345-6789',
                website: 'www.procapture.com',
                address: '456 Camera Lane, Arts District'
            },
            {
                company_name: 'TechVision AV Solutions',
                service_type: 'technology',
                description: 'Complete audio-visual solutions for corporate events. Projectors, sound systems, live streaming, and technical support.',
                contact_email: 'sales@techvisionav.com',
                contact_phone: '+1 (555) 456-7890',
                website: 'www.techvisionav.com',
                address: '789 Tech Park, Innovation Center'
            },
            {
                company_name: 'Elegant Decor & Design',
                service_type: 'decoration',
                description: 'Transform your venue with stunning decorations. Specializing in corporate event themes, floral arrangements, and stage design.',
                contact_email: 'design@elegantdecor.com',
                contact_phone: '+1 (555) 567-8901',
                website: 'www.elegantdecor.com',
                address: '321 Design Street, Creative Quarter'
            },
            {
                company_name: 'Stellar Entertainment Group',
                service_type: 'entertainment',
                description: 'Live bands, DJs, speakers, and performers for corporate events. Making your events memorable and engaging.',
                contact_email: 'book@stellarentertainment.com',
                contact_phone: '+1 (555) 678-9012',
                website: 'www.stellarentertainment.com',
                address: '654 Music Row, Entertainment District'
            },
            {
                company_name: 'Executive Transport Co.',
                service_type: 'transportation',
                description: 'Luxury transportation services for corporate events. VIP shuttles, car services, and logistics management.',
                contact_email: 'rides@executivetransport.com',
                contact_phone: '+1 (555) 789-0123',
                website: 'www.executivetransport.com',
                address: '987 Fleet Avenue, Logistics Hub'
            }
        ];

        let count = 0;
        for (let i = 0; i < Math.min(sampleVendors.length, vendorUsers.length); i++) {
            const vendor = sampleVendors[i];
            const userId = vendorUsers[i].id;

            // Check if vendor already exists for this user
            const [existing] = await pool.query('SELECT id FROM vendors WHERE user_id = ?', [userId]);
            
            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO vendors (user_id, company_name, service_type, description, contact_email, contact_phone, website, address, is_approved) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
                    [userId, vendor.company_name, vendor.service_type, vendor.description, 
                     vendor.contact_email, vendor.contact_phone, vendor.website, vendor.address]
                );
                count++;
            }
        }

        console.log(`✅ ${count} vendors seeded successfully`);

    } catch (error) {
        console.error('Failed to seed vendors:', error.message);
    } finally {
        process.exit();
    }
}

seedVendors();