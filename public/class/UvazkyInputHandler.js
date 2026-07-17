// Handler pro odesílání requestů po změně číselného inputu
export class NumberInputHandler {
    constructor(inputSelector, options = {}) {
        this.input = document.querySelector(inputSelector);
        if (!this.input) {
            throw new Error(`Input element s selektorem "${inputSelector}" nebyl nalezen`);
        }

        // Konfigurace
        this.options = {
            debounceDelay: 300, // Zpoždění pro debouncing (ms)
            minValue: options.minValue || 0,
            maxValue: options.maxValue || 100,
            endpoint: options.endpoint || '/api/process-number',
            method: options.method || 'POST',
            headers: options.headers || {
                'Content-Type': 'application/json',
            },
            ...options
        };

        this.statusElement = document.getElementById('status');
        this.lastSentValueElement = document.getElementById('lastSentValue');
        this.lastSentValue = null;
        this.debounceTimer = null;

        this.init();
    }

    init() {
        // Přidání event listenerů
        this.input.addEventListener('input', this.handleInputChange.bind(this));
        this.input.addEventListener('change', this.handleInputChange.bind(this));
        
        // Validace při odchodu z inputu
        this.input.addEventListener('blur', this.validateValue.bind(this));

        // console.log('NumberInputHandler inicializován');
    }

    handleInputChange(event) {
        const value = this.input.value.trim();
        
        // Pokud je hodnota prázdná, neodesíláme
        if (value === '') {
            this.showStatus('Zadejte prosím hodnotu', 'info');
            return;
        }

        const numberValue = parseFloat(value);
        
        // Validace čísla
        if (isNaN(numberValue)) {
            this.showStatus('Zadejte prosím platné číslo', 'error');
            return;
        }

        // Kontrola rozsahu
        if (numberValue < this.options.minValue || numberValue > this.options.maxValue) {
            this.showStatus(
                `Hodnota musí být mezi ${this.options.minValue} a ${this.options.maxValue}`,
                'error'
            );
            return;
        }

        // Debouncing - zrušíme předchozí timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Nastavíme nový timer
        this.debounceTimer = setTimeout(() => {
            this.sendRequest(numberValue);
        }, this.options.debounceDelay);
    }

    async sendRequest(value) {
        // Kontrola, zda se hodnota nezměnila od posledního odeslání
        if (this.lastSentValue === value) {
            console.log('Hodnota se nezměnila, request nebude odeslán');
            return;
        }

        this.showStatus('Odesílám data...', 'loading');

        try {
            const response = await fetch(this.options.endpoint, {
                method: this.options.method,
                headers: this.options.headers,
                body: JSON.stringify({
                    inputDay: this.options.inputDay || null,
                    value: value,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Aktualizace UI
            this.lastSentValue = value;
            this.updateLastSentValue(value);
            
            this.showStatus(`Data úspěšně odeslána: ${JSON.stringify(data)}`, 'success');
            console.log('Request úspěšně odeslán:', data);

            // Volání callbacku pro úspěch
            if (this.options.onSuccess) {
                this.options.onSuccess(data, value);
            }

        } catch (error) {
            console.error('Chyba při odesílání requestu:', error);
            this.showStatus(`Chyba při odesílání: ${error.message}`, 'error');
            
            // Volání callbacku pro chybu
            if (this.options.onError) {
                this.options.onError(error);
            }
        }
    }

    validateValue() {
        const value = this.input.value.trim();
        if (value === '') return;

        const numberValue = parseFloat(value);
        if (isNaN(numberValue)) {
            this.showStatus('Zadejte prosím platné číslo', 'error');
            return;
        }

        if (numberValue < this.options.minValue || numberValue > this.options.maxValue) {
            this.showStatus(
                `Hodnota musí být mezi ${this.options.minValue} a ${this.options.maxValue}`,
                'error'
            );
        }
    }

    showStatus(message, type = 'info') {
        if (!this.statusElement) return;

        this.statusElement.textContent = message;
        this.statusElement.className = type;
        this.statusElement.style.display = 'block';

        // Automatické skrytí po 5 sekundách pro úspěch a info
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                this.statusElement.style.display = 'none';
            }, 5000);
        }
    }

    updateLastSentValue(value) {
        if (this.lastSentValueElement) {
            this.lastSentValueElement.textContent = value;
        }
    }

    // Manuální odeslání aktuální hodnoty
    sendCurrentValue() {
        const value = this.input.value.trim();
        if (value === '') {
            this.showStatus('Input je prázdný', 'error');
            return;
        }

        const numberValue = parseFloat(value);
        if (!isNaN(numberValue)) {
            this.sendRequest(numberValue);
        }
    }

    // Získání aktuální hodnoty
    getCurrentValue() {
        const value = this.input.value.trim();
        return value !== '' ? parseFloat(value) : null;
    }

    // Nastavení hodnoty programově
    setValue(value) {
        this.input.value = value;
        this.handleInputChange({ target: this.input });
    }

    // Zničení handleru
    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        // Odebrání event listenerů
        this.input.removeEventListener('input', this.handleInputChange);
        this.input.removeEventListener('change', this.handleInputChange);
        this.input.removeEventListener('blur', this.validateValue);
        console.log('NumberInputHandler zničen');
    }
}