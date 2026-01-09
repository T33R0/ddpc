import {
    Body,
    Button,
    Container,
    Column,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Row,
    Section,
    Text,
    Tailwind,
  } from "@react-email/components";
  import * as React from "react";
  
  export const WelcomeEmail = () => {
    const previewText = "The garage is open. Start your build log.";
  
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Tailwind>
          <Body className="bg-neutral-900 font-sans my-auto mx-auto px-2">
            <Container className="border border-solid border-neutral-800 rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-black">
              
              {/* Logo Placeholder */}
              <Section className="mt-[32px]">
                 <Text className="text-white font-mono text-center text-xl tracking-widest font-bold">
                    DDPC // GARAGE
                 </Text>
              </Section>
  
              {/* Hero Section */}
              <Heading className="text-white text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                Welcome to the Build.
              </Heading>
              
              <Text className="text-neutral-300 text-[14px] leading-[24px]">
                You've just completed an important step. Great work.
              </Text>
              <Text className="text-neutral-300 text-[14px] leading-[24px]">
                We built ddpc for the people who actually turn wrenches and track miles. 
                Since you're here to build, not just browse, here are the best ways to break in your new account:
              </Text>
  
              {/* Action Grid */}
              <Section className="my-[20px]">
                <Row>
                  <Column className="align-top w-1/2 pr-2">
                    <Section className="bg-neutral-900 p-4 rounded border border-neutral-800">
                      <Text className="text-red-600 font-bold text-[14px] m-0 mb-2 uppercase tracking-wide">1. Park It</Text>
                      <Text className="text-neutral-400 text-[12px] m-0 leading-[18px]">
                        Add your first vehicle to the Garage. Even if it's stock (for now).
                      </Text>
                    </Section>
                  </Column>
                  <Column className="align-top w-1/2 pl-2">
                    <Section className="bg-neutral-900 p-4 rounded border border-neutral-800">
                      <Text className="text-red-600 font-bold text-[14px] m-0 mb-2 uppercase tracking-wide">2. Log It</Text>
                      <Text className="text-neutral-400 text-[12px] m-0 leading-[18px]">
                        Document your last maintenance item or mod. Data is leverage.
                      </Text>
                    </Section>
                  </Column>
                </Row>
              </Section>
  
              {/* Call To Action */}
              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-white rounded text-black px-6 py-3 text-[12px] font-bold no-underline text-center uppercase tracking-wider hover:bg-neutral-200"
                  href="https://ddpc.app/garage"
                >
                  Enter Garage
                </Button>
              </Section>
  
              <Text className="text-neutral-500 text-[12px] leading-[24px] text-center">
                Just lean into your tinkerer brain and figure it out.
              </Text>
  
              <Hr className="border border-solid border-neutral-800 my-[26px] mx-0 w-full" />
  
              <Text className="text-neutral-600 text-[10px] uppercase tracking-widest text-center">
                ddpc // Fort Collins, CO
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default WelcomeEmail;