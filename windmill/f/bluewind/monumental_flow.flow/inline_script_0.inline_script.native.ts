// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(domain_name: string, superagent_api_key: string) {
  const API_URL =
    "https://api.beta.superagent.sh/api/v1/workflows/c6358868-cbb0-4225-98ef-5ad3d7dc91d4/invoke";
  const HEADERS = {
    authorization: `Bearer ${superagent_api_key}`,
    "content-type": "application/json",
  };

  const PAYLOAD = JSON.stringify({
    input: `Research ${domain_name} and create a detailed report including:
- "product": one sentence description of the product/service they sell
- "customer": who they sell their product/service to
- "top_3_industries": the top 3 industries of their Ideal Customer Profile
- "icp_headcount": the headcount of their ICP. It can be multiple items from this list: 1-10 11-20 21-50 51-100 101-200 201-500 501-1000 1001-2000 2001-5000 5001-10000
- "icp_job_titles": some titles that their Ideal Customer Profile has
here are the industries you're allowed to pick:
Education Management
E-Learning
Higher Education
Primary/Secondary Education
Research
Building Materials
Civil Engineering
Construction
Design
Architecture & Planning

Graphic Design
Accounting
Business Supplies & Equipment
Environmental Services
Events Services
Executive Office
Facilities Services
Human Resources
Information Services
Management Consulting
Outsourcing/Offshoring
Professional Training & Coaching
Security & Investigations
Staffing & Recruiting
Retail
Supermarkets
Wholesale
Mining & Metals
Oil & Energy
Utilities
Manufacturing
Automotive
Aviation & Aerospace
Chemicals
Defense & Space
Electrical & Electronic Manufacturing
Food Production
Glass, Ceramics & Concrete
Industrial Automation
Machinery
Mechanical or Industrial Engineering
Packaging & Containers
Paper & Forest Products
Plastics
Railroad Manufacture
Renewables & Environment
Shipbuilding
Textiles
Banking
Capital Markets
Financial Services
Insurance
Investment Banking
Investment Management
Venture Capital & Private Equity
Airlines/Aviation
Gambling & Casinos
Hospitality
Leisure, Travel & Tourism
Restaurants
Recreational Facilities & Services
Sports
Arts & Crafts
Fine Art
Performing Arts
Photography
Biotechnology
Hospital & Health Care
Medical Device
Medical Practice
Mental Health Care
Pharmaceuticals
Veterinary
Computer Hardware
Computer Networking
Nanotechnologie
Semiconductors
Telecommunications
Wireless
Commercial Real Estate
Real Estate
Alternative Dispute Resolution
Law Practice
Legal Services
Apparel & Fashion
Consumer Electronics
Consumer Goods
Consumer Services
Cosmetics
Food & Beverages
Furniture
Luxury Goods & Jewelry
Sporting Goods
Tobacco
Wine and Spirits
Dairy
Farming
Fishery
Ranching
Market Research
Marketing & Advertising
Newspapers
Online Media
Printing
Public Relations & Communications
Publishing
Translation & Localization
Writing & Editing
Civic & Social Organization
Fundraising
Individual & Family Services
International Trade & Development
Libraries
Museums & Institutions
Non-Profit Organization Management
Philanthropy
Program Development
Religious Institutions
Think Tanks
Computer & Network Security
Computer Software
Information Technology & Services
Internet
Import & Export
Logistics & Supply Chain
Maritime
Package/Freight Delivery
Transportation/Trucking/Railroad
Warehousing
Animation
Broadcast Media
Computer Games
Entertainment
Media Production
Mobile Games
Motion Pictures & Film
Music
Alternative Medicine
Health, Wellness & Fitness
Law Enforcement
Military
Public Safety
Government Administration
Government Relations
International Affairs
Judiciary
Legislative Office
Political Organization
Public Policy
`,

    enableStreaming: false,
    // Remove outputSchema to return text.
    outputSchema: "{product: string, customer: string, top_3_industries: array, icp_headcount: array, icp_job_titles: array,}",
  });

  const responseData = await fetch(API_URL, {
    method: "POST",
    headers: HEADERS,
    body: PAYLOAD,
  });

  const { data: { output } } = await responseData.json();
  return output
}
