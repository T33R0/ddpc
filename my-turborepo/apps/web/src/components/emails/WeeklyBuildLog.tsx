import * as React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Text,
    Link,
    Preview,
    Section,
    Heading,
    Row,
    Column,
    Hr,
} from '@react-email/components';

interface WeeklyBuildLogProps {
    date: string;
    features: string[];
    fixes: string[];
    proTip?: string;
}

export const WeeklyBuildLog = ({
    date,
    features = [],
    fixes = [],
    proTip,
}: WeeklyBuildLogProps) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <Html>
            <Head />
            <Preview>DDPC Build Log: Progress for {formattedDate}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>DDPC // BUILD LOG</Heading>
                    <Text style={intro}>Progress for the week of {formattedDate}.</Text>

                    {features.length > 0 && (
                        <Section style={section}>
                            <Text style={subHeader}>NEW FEATURES</Text>
                            {features.map((feature, index) => (
                                <Row key={index} style={itemRow}>
                                    <Column style={badgeCol}>
                                        <Text style={newBadge}>NEW</Text>
                                    </Column>
                                    <Column>
                                        <Text style={itemText}>{feature}</Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                    )}

                    {fixes.length > 0 && (
                        <Section style={section}>
                            <Text style={subHeader}>FIXES & IMPROVEMENTS</Text>
                            {fixes.map((fix, index) => (
                                <Row key={index} style={itemRow}>
                                    <Column style={badgeCol}>
                                        <Text style={fixBadge}>FIX</Text>
                                    </Column>
                                    <Column>
                                        <Text style={itemText}>{fix}</Text>
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                    )}

                    {proTip && (
                        <Section style={proTipBox}>
                            <Text style={proTipHeader}>💡 PRO TIP</Text>
                            <Text style={proTipText}>{proTip}</Text>
                        </Section>
                    )}

                    <Hr style={divider} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            You received this email because you are subscribed to the Weekly Build Log.
                            <br />
                            <Link href="{{UnsubscribeURL}}" style={link}>
                                Unsubscribe from updates
                            </Link>
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
};

const h1 = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    lineHeight: '1.3',
    margin: '16px 0',
    padding: '0',
};

const intro = {
    color: '#444',
    fontSize: '15px',
    lineHeight: '1.4',
    margin: '0 0 24px',
};

const section = {
    margin: '0 0 24px',
};

const subHeader = {
    color: '#888',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
};

const itemRow = {
    marginBottom: '8px',
};

const badgeCol = {
    width: '50px',
    verticalAlign: 'top',
};

const itemText = {
    color: '#1a1a1a',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
};

const badgeBase = {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
    marginRight: '8px',
    margin: '0',
};

const newBadge = {
    ...badgeBase,
    backgroundColor: '#dcfce7', // green-100
    color: '#166534', // green-800
};

const fixBadge = {
    ...badgeBase,
    backgroundColor: '#fee2e2', // red-100
    color: '#991b1b', // red-800
};

const proTipBox = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    marginTop: '32px',
};

const proTipHeader = {
    margin: '0 0 8px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#1a1a1a',
};

const proTipText = {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#4b5563',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '32px 0 24px',
};

const footer = {
    textAlign: 'center' as const,
};

const footerText = {
    color: '#6b7280',
    fontSize: '12px',
    lineHeight: '1.5',
};

const link = {
    color: '#1a1a1a',
    textDecoration: 'underline',
};
