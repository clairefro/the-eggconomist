class EggChartManager {
  constructor() {
    this.eggImage = this.chart = null;
    this.originalLabels = [];
    this.originalValues = [];
    this.defaultRange = "5y";
    this.csvUrl =
      "https://raw.githubusercontent.com/clairefro/the-eggconomist/refs/heads/main/egg_prices.csv";
  }

  async init() {
    // first things first
    this.eggImage = new Image(16, 16);
    this.eggImage.src =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text x="0" y="14">🥚</text></svg>';

    await this.renderChart();
    this.setTimeRange(this.defaultRange);
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
    const startIndex = Math.max(0, values.length - monthsToShow);

    return {
      labels: labels.slice(startIndex),
      values: values.slice(startIndex),
    };
  }

  setTimeRange(range) {
    if (!this.chart) return;

    if (range === "all") {
      this.chart.data.labels = this.originalLabels;
      this.chart.data.datasets[0].data = this.originalValues;
    } else {
      const filtered = this.filterDataByTimeRange(
        this.originalLabels,
        this.originalValues,
        range
      );
      this.chart.data.labels = filtered.labels;
      this.chart.data.datasets[0].data = filtered.values;
      // update point styles for filtered data
      this.updatePointStyles(filtered.values.length);
    }

    this.chart.update();
  }

  updatePointStyles(dataLength) {
    this.chart.data.datasets[0].pointStyle = Array(dataLength).fill("circle");
    this.chart.data.datasets[0].pointStyle[dataLength - 1] = this.eggImage;
  }

  getMoMs = (prices) => {
    return prices.map((price, index) => {
      if (index === 0) return null; // mo MoM change for the first month
      return ((price - prices[index - 1]) / prices[index - 1]) * 100;
    });
  };

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
            label: "Avg. Price (USD)",
            data: values,
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 2,
            fill: false,
            pointStyle: values.map((_, index) =>
              index === values.length - 1 ? this.eggImage : "circle"
            ),
            // pointRadius: values.map((_, index) =>
            //   index === values.length - 1 ? 10 : 0
            // ),
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
