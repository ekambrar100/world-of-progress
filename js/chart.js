class ChartVisualization {
    constructor() {
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.margin = { top: 20, right: 30, bottom: 30, left: 60 };
        this.initialize();
    }

    initialize() {
        const container = document.getElementById('chart');
        this.width = container.clientWidth - this.margin.left - this.margin.right;
        this.height = container.clientHeight - this.margin.top - this.margin.bottom;

        this.svg = d3.select('#chart')
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Add axes
        this.xScale = d3.scaleLinear()
            .range([0, this.width]);

        this.yScale = d3.scaleLinear()
            .range([this.height, 0]);

        this.xAxis = this.svg.append('g')
            .attr('transform', `translate(0,${this.height})`);

        this.yAxis = this.svg.append('g');

        // Add labels
        this.svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', -this.margin.left + 20)
            .attr('x', -this.height / 2)
            .style('text-anchor', 'middle')
            .text('Infant Mortality Rate');

        // Add line generator
        this.line = d3.line()
            .x(d => this.xScale(d.year))
            .y(d => this.yScale(d.value))
            .defined(d => d.value !== null);
    }

    updateData(countries) {
        // Update scales
        if (!countries || countries.length === 0) {
            console.warn('No data to display for the selected countries.');
            return;
        }
        const years = dataManager.years;
        const allValues = countries.flatMap(c => c.values.map(v => v.value).filter(v => v !== null));

        this.xScale.domain([d3.min(years), d3.max(years)]);
        this.yScale.domain([0, d3.max(allValues) * 1.1]);

        // Update axes
        this.xAxis.call(d3.axisBottom(this.xScale).tickFormat(d3.format('d')));
        this.yAxis.call(d3.axisLeft(this.yScale));

        // Update lines
        const lines = this.svg.selectAll('.country-line')
            .data(countries, d => d.code);

        // Remove old lines
        lines.exit().remove();

        // Add new lines
        lines.enter()
            .append('path')
            .attr('class', 'country-line')
            .merge(lines)
            .attr('d', d => this.line(d.values))
            .style('fill', 'none')
            .style('stroke', (_, i) => d3.schemeCategory10[i % 10])
            .style('stroke-width', 2);

        // Add country labels at the end of each line
        const labels = this.svg.selectAll('.country-label')
            .data(countries, d => d.code);

        labels.exit().remove();

        const lastValidValue = (country) => {
            return [...country.values].reverse().find(v => v.value !== null);
        };

        labels.enter()
            .append('text')
            .attr('class', 'country-label')
            .merge(labels)
            .attr('x', d => this.xScale(lastValidValue(d).year) + 5)
            .attr('y', d => this.yScale(lastValidValue(d).value))
            .text(d => d.name)
            .style('font-size', '12px')
            .style('fill', (_, i) => d3.schemeCategory10[i % 10]);
    }
}

const chartViz = new ChartVisualization();
