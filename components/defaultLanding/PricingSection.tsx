import { CheckIcon } from '@heroicons/react/20/solid';
import { useTranslation } from 'next-i18next';
import { Button, Card, Link } from 'react-daisyui';

const PricingSection = () => {
  const { t } = useTranslation('common');

  return (
    <section className="py-6">
      <div className="flex flex-col justify-center space-y-6">
        <h2 className="text-center text-4xl font-bold normal-case">
          {t('pricing')}
        </h2>
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card className="rounded-md dark:border-gray-200 border border-gray-300">
              <Card.Body>
                <Card.Title tag="h2">Free forever</Card.Title>
                <div className="mt-5">
                  <ul className="flex flex-col space-y-2">
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">Access to all workflows</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">Discord access</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">API access</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">
                        Add your secrets to infisical
                      </span>
                    </li>
                  </ul>
                </div>
              </Card.Body>
              <Card.Actions className="justify-center m-2">
                <Link href="/buy-now">
                  <Button
                    color="primary"
                    className="md:w-full w-3/4 rounded-md"
                    size="md"
                  >
                    {t('buy-now')}
                  </Button>
                </Link>
              </Card.Actions>
            </Card>

            <Card className="rounded-md dark:border-gray-200 border border-gray-300">
              <Card.Body>
                <Card.Title tag="h2">Lifetime deal: 199$</Card.Title>
                <p className="text-gray-500">99$/month</p>
                <div className="mt-5">
                  <ul className="flex flex-col space-y-2">
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">
                        one api key to manage all your expenses
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">
                        access to expensive/private beta APIs
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">"pro" role on discord</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">
                        invited to the daily office hours
                      </span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">
                        discounts and limited offers from our partners
                      </span>
                    </li>
                  </ul>
                </div>
              </Card.Body>
              <Card.Actions className="justify-center m-2">
                <Link href="/buy-now">
                  <Button
                    color="primary"
                    className="md:w-full w-3/4 rounded-md"
                    size="md"
                  >
                    {t('buy-now')}
                  </Button>
                </Link>
              </Card.Actions>
            </Card>

            <Card className="rounded-md dark:border-gray-200 border border-gray-300">
              <Card.Body>
                <Card.Title tag="h2">
                  Enterprise: Own your GTM engine
                </Card.Title>
                <div className="mt-5">
                  <ul className="flex flex-col space-y-2">
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">Self-hosted</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">Audit logs</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">SAML support</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">Unlimited SSO users</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">Commercial licence</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">SLA & Priority Support 24/7.</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5" />
                      <span className="ml-1">Design partners for roadmap</span>
                    </li>
                  </ul>
                </div>
              </Card.Body>
              <Card.Actions className="justify-center m-2">
                <Link href="/buy-now">
                  <Button
                    color="primary"
                    className="md:w-full w-3/4 rounded-md"
                    size="md"
                  >
                    {t('buy-now')}
                  </Button>
                </Link>
              </Card.Actions>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
