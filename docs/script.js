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
    console.log({ label });
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

    document.querySelectorAll(".chart-controls button").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-range") === range) {
        btn.classList.add("active");
      }
    });

    if (range === "all") {
      this.chart.data.labels = this.originalLabels;
      this.chart.data.datasets[0].data = this.originalValues;
      this.updatePointStyles(this.originalValues.length);
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
    this.updateMetrics();
  }

  updatePointStyles(dataLength) {
    this.chart.data.datasets[0].pointStyle = Array(dataLength).fill("circle");
    this.chart.data.datasets[0].pointStyle[dataLength - 1] = this.eggImage;
  }

  // Add to EggChartManager class
  updateMetrics() {
    const latest = this.originalValues[this.originalValues.length - 1];
    const prevMonth = this.originalValues[this.originalValues.length - 2];
    const prevYear = this.originalValues[this.originalValues.length - 13];
    const fiveYearData = this.originalValues.slice(-60);
    const fiveYearHigh = Math.max(...fiveYearData);
    const fiveYearHighIndex = this.originalValues.indexOf(fiveYearHigh);

    const momChange = (((latest - prevMonth) / prevMonth) * 100).toFixed(1);
    const yoyChange = (((latest - prevYear) / prevYear) * 100).toFixed(1);

    document.getElementById("latest-price").textContent = latest.toFixed(2);
    document.getElementById("latest-date").textContent = this.formatLabel(
      this.originalLabels[this.originalLabels.length - 1]
    );

    document.getElementById("mom-change").textContent = momChange;
    document.getElementById("mom-trend").textContent =
      momChange > 0 ? "↑" : "↓";
    document.getElementById("mom-date").textContent = this.formatLabel(
      this.originalLabels[this.originalLabels.length - 2]
    );

    document.getElementById("yoy-change").textContent = yoyChange;
    document.getElementById("yoy-trend").textContent =
      yoyChange > 0 ? "↑" : "↓";
    document.getElementById("yoy-date").textContent = this.formatLabel(
      this.originalLabels[this.originalLabels.length - 13]
    );

    document.getElementById("five-year-high").textContent =
      fiveYearHigh.toFixed(2);
    document.getElementById("high-date").textContent = this.formatLabel(
      this.originalLabels[fiveYearHighIndex]
    );

    // append classes for -/+ color change
    const momDataEl = document.getElementById("mom-data");
    const yoyDataEl = document.getElementById("yoy-data");

    momDataEl.classList.remove("trend-up", "trend-down");
    yoyDataEl.classList.remove("trend-up", "trend-down");

    momDataEl.classList.add(momChange > 0 ? "trend-up" : "trend-down");
    yoyDataEl.classList.add(yoyChange > 0 ? "trend-up" : "trend-down");
  }

  async renderChart() {
    const csvData = await this.fetchData();
    let { labels, values } = this.parseCSV(csvData);
    labels = labels.map((label) => this.formatLabel(label));

    this.originalLabels = labels;
    this.originalValues = values;

    const ctx = document.getElementById("egg-price-chart").getContext("2d");
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
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "nearest",
          axis: "x",
        },
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
