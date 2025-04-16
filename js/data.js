class DataManager {
    constructor() {
        this.data = null;
        this.years = [];
        this.countries = [];
        this.regions = {
            'africa': ['AGO', 'BDI', 'BEN', 'BFA', 'BWA', 'CAF', 'CIV', 'CMR', 'COD', 'COG', 
                       'COM', 'CPV', 'DJI', 'DZA', 'EGY', 'ERI', 'ETH', 'GAB', 'GHA', 'GIN', 
                       'GMB', 'GNB', 'GNQ', 'KEN', 'LBR', 'LBY', 'LSO', 'MAR', 'MDG', 'MLI', 
                       'MOZ', 'MRT', 'MUS', 'MWI', 'NAM', 'NER', 'NGA', 'RWA', 'SDN', 'SEN', 
                       'SLE', 'SOM', 'SSD', 'STP', 'SWZ', 'SYC', 'TCD', 'TGO', 'TUN', 'TZA', 
                       'UGA', 'ZAF', 'ZMB', 'ZWE'],
            'latinAmerica': ['ARG', 'BOL', 'BRA', 'CHL', 'COL', 'CRI', 'CUB', 'DOM', 'ECU', 
                            'GTM', 'HND', 'HTI', 'JAM', 'MEX', 'NIC', 'PAN', 'PER', 'PRY', 
                            'SLV', 'URY', 'VEN'],
            'sub-saharan-africa': ['AGO', 'BDI', 'BEN', 'BFA', 'BWA', 'CAF', 'CIV', 'CMR', 'COD', 'COG', 
                                  'COM', 'CPV', 'DJI', 'ETH', 'GAB', 'GHA', 'GIN', 'GMB', 'GNB', 'GNQ', 
                                  'KEN', 'LBR', 'LSO', 'MDG', 'MLI', 'MOZ', 'MRT', 'MUS', 'MWI', 'NAM', 
                                  'NER', 'NGA', 'RWA', 'SEN', 'SLE', 'SOM', 'SSD', 'STP', 'SWZ', 'SYC', 
                                  'TCD', 'TGO', 'TZA', 'UGA', 'ZAF', 'ZMB', 'ZWE']
        };
    }

    async loadData() {
        const response = await fetch('../wbi.csv');
        const csvText = await response.text();
        this.data = d3.csvParse(csvText);
        
        const headers = Object.keys(this.data[0]);
        this.years = headers.filter(h => !isNaN(h)).map(Number).sort();
        
        this.countries = this.data.map(row => {
            const values = this.years.map(year => ({
                year: year,
                value: parseFloat(row[year]) || null
            }));
            
            return {
                name: row['Country Name'],
                code: row['Country Code'],
                values: values
            };
        }).filter(country => 
            country.values.some(v => v.value !== null) && 
            !country.name.includes('income') && 
            !country.name.includes('aggregate')
        );

        this.calculateProgress();
    }

    calculateProgress() {
        this.countries.forEach(country => {
            const firstYear = country.values.find(v => v.value !== null);
            const lastYear = [...country.values].reverse().find(v => v.value !== null);
            
            if (firstYear && lastYear) {
                country.progress = {
                    absolute: firstYear.value - lastYear.value,
                    percentage: ((firstYear.value - lastYear.value) / firstYear.value) * 100
                };
            }
        });

        this.topProgress = [...this.countries]
            .filter(c => c.progress && !isNaN(c.progress.percentage))
            .sort((a, b) => b.progress.percentage - a.progress.percentage)
            .slice(0, 5);
    }

    getDataForYear(year) {
        return this.countries.map(country => ({
            name: country.name,
            code: country.code,
            value: country.values.find(v => v.year === year)?.value
        })).filter(d => d.value !== null);
    }

    getCountryData(countryCode) {
        return this.countries.find(c => c.code === countryCode);
    }
    
    getCountriesInRegion(regionCode) {
        if (this.regions[regionCode]) {
            return this.regions[regionCode];
        }
        return [];
    }
}

const dataManager = new DataManager();
