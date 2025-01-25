// Fetch the CSV data from the GitHub raw URL
const csvUrl =
  "https://raw.githubusercontent.com/clairefro/the-eggconomist/refs/heads/main/egg_prices.csv";

// parse CSV data
async function fetchData() {
  const response = await fetch(csvUrl);
  const data = await response.text();
  return data;
}

// convert CSV data to Chart.js format
function parseCSV(csvData) {
  const rows = csvData.split("\n").slice(1); // skip header row
  const labels = [];
  const values = [];

  rows.forEach((row) => {
    const [year, period, value, updated_at] = row.split(",");
    if (year && period && value) {
      const date = `${year}-${period.padStart(2, "0")}`; // format as yyyy-mm
      labels.push(date);
      values.push(parseFloat(value));
    }
  });

  return { labels, values };
}

// Render the line chart
async function renderChart() {
  const csvData = await fetchData();
  const { labels, values } = parseCSV(csvData);

  const ctx = document.getElementById("eggPriceChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label:
            "Average Price (USD): Eggs, Grade A, Large (Cost per Dozen) in U.S. City Average",
          data: values,
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Date (yyyy-mm)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Price (USD)",
          },
        },
      },
    },
  });
}

// Initialize the chart
renderChart();
