import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all users with notifications enabled
        const allUsers = await base44.asServiceRole.entities.User.list();
        const usersToNotify = allUsers.filter(user => {
            const frequency = user.notify_frequency || 'daily';
            return frequency !== 'off';
        });

        const results = {
            processed: 0,
            notified: 0,
            skipped: 0,
            errors: []
        };

        for (const user of usersToNotify) {
            results.processed++;
            
            try {
                // Check if user has incomplete goals or progress items
                const [goals, progressItems] = await Promise.all([
                    base44.asServiceRole.entities.Progress.filter({ 
                        created_by: user.email,
                        status: ['planning', 'active', 'blocked']
                    }),
                    base44.asServiceRole.entities.Progress.filter({ 
                        created_by: user.email 
                    })
                ]);

                const incompleteGoals = goals.filter(g => g.status !== 'completed');
                
                if (incompleteGoals.length === 0) {
                    results.skipped++;
                    continue;
                }

                // Get user's first name
                const firstName = user.full_name?.split(' ')[0] || user.email.split('@')[0];
                
                // Build message
                const goalCount = incompleteGoals.length;
                const subject = "AceFlo Reminder: Stay in your rhythm";
                const body = `Hey ${firstName},

You've got ${goalCount} goal${goalCount > 1 ? 's' : ''} waiting for you.

Progress comes one step at a time. What's the next move?

— AceFlo

https://aceflo.ai`;

                const channel = user.notify_channel || 'email';
                
                // Send email
                if (channel === 'email' || channel === 'both') {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        from_name: "AceFlo",
                        to: user.email,
                        subject: subject,
                        body: body
                    });
                }
                
                // Send SMS (if phone number provided and channel includes SMS)
                if ((channel === 'sms' || channel === 'both') && user.phone_number) {
                    // Note: SMS integration would need to be implemented
                    // For now, we'll skip SMS or you can add a third-party SMS service
                    console.log(`SMS would be sent to ${user.phone_number}`);
                }
                
                results.notified++;
            } catch (error) {
                results.errors.push({
                    user: user.email,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            summary: results
        });
    } catch (error) {
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});