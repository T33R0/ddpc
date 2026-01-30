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
    Button,
} from '@react-email/components';
import { parseSimpleMarkdown } from '../../lib/text-formatting';

interface WeeklyBuildLogProps {
    date: string;
    features: string[];
    fixes: string[];
    improvements?: string[];
    message?: string;
    proTip?: string;
}

export const WeeklyBuildLog = ({
    date,
    features = [],
    fixes = [],
    improvements = [],
    message,
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
                    <Text style={intro}>Progress for the week of {formattedDate}</Text>

                    <Hr style={divider} />

                    {message && (
                        <Section style={section}>
                            <Text style={subHeader}>FROM THE SHOP</Text>
                            <Text 
                                style={messageText}
                                dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(message) }}
                            />
                        </Section>
                    )}

                    <Hr style={divider} />

                    {features.length > 0 && (
                        <Section style={section}>
                            <Text style={subHeader}>FRESH OFF THE LIFT</Text>
                            {features.map((feature, index) => (
                                <Row key={index} style={itemRow}>
                                    <Column style={bulletCol}>
                                        <Text style={bullet}>•</Text>
                                    </Column>
                                    <Column>
                                        <Text 
                                            style={itemText}
                                            dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(feature) }}
                                        />
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                    )}

                    {fixes.length > 0 && (
                        <Section style={section}>
                            <Text style={subHeader}>UNDER THE HOOD FIXES</Text>
                            {fixes.map((fix, index) => (
                                <Row key={index} style={itemRow}>
                                    <Column style={bulletCol}>
                                        <Text style={bullet}>•</Text>
                                    </Column>
                                    <Column>
                                        <Text 
                                            style={itemText}
                                            dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(fix) }}
                                        />
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                    )}

                    {improvements.length > 0 && (
                        <Section style={section}>
                            <Text style={subHeader}>ON THE ROADMAP</Text>
                            {improvements.map((improvement, index) => (
                                <Row key={index} style={itemRow}>
                                    <Column style={bulletCol}>
                                        <Text style={bullet}>•</Text>
                                    </Column>
                                    <Column>
                                        <Text 
                                            style={itemText}
                                            dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(improvement) }}
                                        />
                                    </Column>
                                </Row>
                            ))}
                        </Section>
                    )}

                    <Hr style={divider} />

                    {proTip && (
                        <Section style={section}>
                            <Text style={subHeader}>💡 PIT CREW TIP</Text>
                            <Text 
                                style={messageText}
                                dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(proTip) }}
                            />
                        </Section>
                    )}

                    <Hr style={divider} />

                    <Section style={buttonSection}>
                        <Button style={button} href="{{AppUrl}}/garage">
                            Go to my Garage
                        </Button>
                    </Section>

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
    textAlign: 'center' as const,
};

const intro = {
    color: '#444',
    fontSize: '15px',
    lineHeight: '1.4',
    margin: '0 0 24px',
    textAlign: 'center' as const,
};

const section = {
    margin: '0 0 32px',
};

const subHeader = {
    color: '#666',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '16px',
};

const itemRow = {
    marginBottom: '8px',
};

const bulletCol = {
    width: '24px',
    verticalAlign: 'top',
};

const bullet = {
    color: '#1a1a1a',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
};

const itemText = {
    color: '#1a1a1a',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0',
};

const messageText = {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#374151',
    marginTop: '0',
};

const buttonSection = {
    textAlign: 'center' as const,
    marginTop: '32px',
    marginBottom: '32px',
};

const button = {
    backgroundColor: '#000000',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '32px 0',
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
