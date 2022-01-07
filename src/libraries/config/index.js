/* eslint-disable camelcase */
const Config = {
    env: process.env.APP_ENV,
    baseURL: process.env.API_URL,
    locales: { en: 'English', en_EN: 'English', en_GB: 'English' },
    dateFormats: {
        get regular() {
            return Config.dateFormats.options.find((format) => format.default).format;
        },
        get full() {
            return `${Config.dateFormats.regular} HH:mm`;
        },
        grails: 'YYYY-MM-DD HH:mm:ss.S',
        datePicker: (format) => Config.dateFormats.options.find((item) => item.format === format).pickerFormat,
        options: [
            { format: 'DD.MM.YYYY', pickerFormat: 'dd.MM.yyyy', default: true },
            { format: 'MM.DD.YYYY', pickerFormat: 'MM.dd.yyyy' },
            { format: 'DD/MM/YYYY', pickerFormat: 'dd/MM/yyyy' },
            { format: 'MM/DD/YYYY', pickerFormat: 'MM/dd/yyyy' },
            { format: 'DD-MM-YYYY', pickerFormat: 'dd-MM-yyyy' },
            { format: 'MM-DD-YYYY', pickerFormat: 'MM-dd-yyyy' },
        ],
    },
    chartOptions: {
        colors: {
            map: ['#E9EFBF', '#E4E983', '#F1DF0F', '#F8C418', '#F8A41E', '#F6821F', '#F16029', '#EA262A', '#C02231', '#A11E24'],
            red: '#e74c3c',
            green: '#42b2a6',
            blue: '#7fc3f1',
            annotation: {
                inactive: '#6BB9F0',
                active: '#3498DB',
            },
        },
        symbols: {
            suffixed: ['%'],
        },
        marker: {
            radius: 5,
            small: {
                radius: 2,
            },
        },
    },
    pusher: {
        debug: false, // If this is true Pusher will log messages to dev console
        appId: process.env.PUSHER_KEY,
    },
    symbolTypeMap: {
        '£': 'currency',
        '€': 'currency',
        $: 'currency',
        '%': 'percentage',
        123: 'numeric',
        time: 'time',
    },
};

export { Config as default };
