/**
 * @function numberFormatterFactory
 * @param {object} [param0] 
 * @param {string} [param0.locale = 'en-us']
 * @param {string} [param0.localeMatcher = 'best fit'] other value is lookup
 * @param {string} [param0.style = 'decimal'] decimal, currency, or percent
 * @param {string} [param0.currency] iso code for currency
 * @param {string} [param0.currencyDisplay = 'symbol'] 'symbol' or 'code' or 'name'
 * @param {string} [param0.useGrouping = true] 'symbol' or 'code' or 'name'
 * @param {string} [param0.minimumIntegerDigits = 1] range from 1 to 21
 * @param {string} [param0.minimumFractionDigits] range from 0 to 20
 * @param {string} [param0.maximumFractionDigits] range from 0 to 20
 * @param {string} [param0.minimumSignificantDigits = 21] range from 1 to 21
 * @param {string} [param0.maximumSignificantDigits = 21] range from 1 to 21
 * @param {string} [param0.bracketNegatives = false] whether to use parenthesis 
 * @param {string} [param0.noNegativeZero = true] whether t0 allow -0 for rounded values or force 0
 * @returns {function} fromatter function
 */
export const numberFormatterFactory = ({
    locale = 'en-US',
    localeMatcher = 'best fit',
    style = 'decimal',
    currency,
    currencyDisplay = 'symbol',
    useGrouping = true,
    minimumIntegerDigits = 1,
    minimumFractionDigits,
    maximumFractionDigits,
    minimumSignificantDigits,
    maximumSignificantDigits,
    bracketNegatives = false,
    noNegativeZero = true
} = {}) => {
    if(currency && style !== 'currency'){console.warn("You must set style to currenct when providing a formatting as currency")}
    if((minimumFractionDigits || maximumFractionDigits) && (minimumSignificantDigits || maximumSignificantDigits)){ console.warn("You cannot set fraction digits and significant digits in one formatter. Use one or the other.")}
    
    const setup = new Intl.NumberFormat(locale, {
        localeMatcher,
        style,
        currency,
        currencyDisplay,
        useGrouping,
        minimumIntegerDigits,
        minimumFractionDigits,
        maximumFractionDigits,
        minimumSignificantDigits,
        maximumSignificantDigits
      
    })
    
    return value => {

        if(value === null || value === '' || value === undefined) return value;

        let formattedValue = setup.format(value);
        if(noNegativeZero && formattedValue === '-0'){
            formattedValue = '0';
        }else if(noNegativeZero && parseFloat(formattedValue) === 0){
            return setup.format(0)
        }else if(bracketNegatives && formattedValue.startsWith('-')){
            formattedValue = `(${formattedValue.substr(1)})`;
        }
        return formattedValue
    }

}

export const currencyFormatter = numberFormatterFactory({
    currency: 'USD',
    style: "currency",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
})