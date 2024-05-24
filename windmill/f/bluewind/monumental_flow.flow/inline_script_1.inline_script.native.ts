// Fetch-only script, no imports allowed but benefits from a dedicated highly efficient runtime

export async function main(icp_headcount: array, job_titles: array, top_3_industries: array, icp_job_titles: array, product: string, customer: string) {
  const baseUrl = "https://app.apollo.io/#/people?finderViewId=5b8050d050a3893c382e9360&page=1";

  const headcountRanges = icp_headcount.map(range => {
    const [min, max] = range.split("-");
    return `organizationNumEmployeesRanges[]=${min}%2C${max}`;
  }).join("&");

  const jobTitles = job_titles.map(title => {
    return `personTitles[]=${encodeURIComponent(title)}`;
  }).join("&");

  const location = "personLocations[]=United%20States";

  return {
    "url": `${baseUrl}&${headcountRanges}&${jobTitles}&${location}`,
    "product": product,
    "customer": customer,
    "top_3_industries": top_3_industries,
    "icp_headcount": icp_headcount,
    "icp_job_titles": icp_job_titles
  }
}
