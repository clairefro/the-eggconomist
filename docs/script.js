class EggChartManager {
  constructor() {
    this.chart = null;
    this.originalLabels = [];
    this.originalValues = [];
    this.csvUrl =
      "https://raw.githubusercontent.com/clairefro/the-eggconomist/refs/heads/main/egg_prices.csv";
  }

  async init() {
    await this.renderChart();
  }

  formatLabel(label) {
    if (!/^\d{4}-M\d{2}$/.test(label)) {
      console.warn(`Invalid label format: ${label}`);
      return label;
    }

    const [year, monthCode] = label.split("-M");
    const monthAbbreviations = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndex = parseInt(monthCode, 10) - 1;

    if (monthIndex < 0 || monthIndex >= monthAbbreviations.length) {
      console.warn(`Invalid month code: ${monthCode}`);
      return label;
    }

    return `${year}-${monthAbbreviations[monthIndex]}`;
  }

  async fetchData() {
    const response = await fetch(this.csvUrl);
    return response.text();
  }

  parseCSV(csvData) {
    const rows = csvData.split("\n").slice(1);
    const labels = [];
    const values = [];

    rows.forEach((row) => {
      const [year, period, value] = row.split(",");
      if (year && period && value) {
        const date = `${year}-${period.padStart(2, "0")}`;
        labels.push(date);
        values.push(parseFloat(value));
      }
    });

    return { labels, values };
  }

  filterDataByTimeRange(labels, values, range) {
    const periods = {
      "6m": 6,
      "1y": 12,
      "5y": 60,
      all: labels.length,
    };

    const monthsToShow = periods[range];
    return {
      labels: labels.slice(-monthsToShow),
      values: values.slice(-monthsToShow),
    };
  }

  setTimeRange(range) {
    if (!this.chart) return;

    this.chart.data.labels = this.originalLabels;
    this.chart.data.datasets[0].data = this.originalValues;

    if (range !== "all") {
      const filtered = this.filterDataByTimeRange(
        this.originalLabels,
        this.originalValues,
        range
      );
      this.chart.data.labels = filtered.labels;
      this.chart.data.datasets[0].data = filtered.values;
    }

    this.chart.update();
  }

  async renderChart() {
    const csvData = await this.fetchData();
    let { labels, values } = this.parseCSV(csvData);
    labels = labels.map((label) => this.formatLabel(label));

    this.originalLabels = labels;
    this.originalValues = values;

    const ctx = document.getElementById("eggPriceChart").getContext("2d");
    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
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
              text: "Date",
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 15,
              padding: 5,
            },
            grid: {
              display: true,
              drawOnChartArea: true,
              drawTicks: true,
            },
          },
          y: {
            title: {
              display: true,
              text: "Avg. Price (USD)",
            },
          },
        },
      },
    });
  }
}

const eggChartManager = new EggChartManager();
eggChartManager.init();

// Make setTimeRange available for button clicks
window.setTimeRange = (range) => eggChartManager.setTimeRange(range);
