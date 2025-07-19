document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const display = document.getElementById('display');
    const buttons = document.querySelector('.buttons');
    const themeSwitcher = document.getElementById('theme-switcher');
    
    const navCalculator = document.getElementById('nav-calculator');
    const navGames = document.getElementById('nav-games');
    const calculatorSection = document.getElementById('calculator-section');
    const gamesSection = document.getElementById('games-section');

    // Juego
    const problemEl = document.getElementById('problem');
    const answerInput = document.getElementById('game-answer');
    const checkAnswerBtn = document.getElementById('check-answer');
    const feedbackEl = document.getElementById('game-feedback');
    const scoreEl = document.getElementById('score');

    // --- LÓGICA DE CAMBIO DE TEMA (MODO OSCURO/CLARO) ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeSwitcher.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            themeSwitcher.textContent = '🌙';
        }
    };

    themeSwitcher.addEventListener('click', () => {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);


    // --- LÓGICA DE NAVEGACIÓN ---
    navCalculator.addEventListener('click', () => {
        calculatorSection.classList.remove('hidden');
        gamesSection.classList.add('hidden');
        navCalculator.classList.add('active');
        navGames.classList.remove('active');
    });

    navGames.addEventListener('click', () => {
        calculatorSection.classList.add('hidden');
        gamesSection.classList.remove('hidden');
        navCalculator.classList.remove('active');
        navGames.classList.add('active');
        generateNewProblem();
    });


    // --- LÓGICA DE LA CALCULADORA RECURSIVA ---
    let currentExpression = '0';

    buttons.addEventListener('click', (event) => {
        if (!event.target.matches('button')) return;

        const value = event.target.dataset.value;

        if (value === 'C') {
            currentExpression = '0';
        } 
        // --- NUEVO: Lógica para el botón de borrar (DEL) ---
        else if (value === 'DEL') {
            if (currentExpression.length > 1 && currentExpression !== 'Error') {
                // Elimina el último carácter de la expresión
                currentExpression = currentExpression.slice(0, -1);
            } else {
                // Si solo queda un dígito o es un error, resetea a '0'
                currentExpression = '0';
            }
        }
        // --------------------------------------------------
        else if (value === '=') {
            try {
                // El corazón de la calculadora: llamar al evaluador recursivo
                const result = evaluate(currentExpression);
                currentExpression = String(result);
            } catch (error) {
                currentExpression = 'Error';
            }
        } else {
            if (currentExpression === '0' || currentExpression === 'Error') {
                currentExpression = value;
            } else {
                currentExpression += value;
            }
        }
        display.textContent = currentExpression.replace(/\*/g, '×').replace(/\//g, '÷');
    });

    // --- PARSER DE DESCENSO RECURSIVO ---
    function evaluate(expression) {
        // Limpiamos la expresión de espacios y preparamos para el parseo
        let tokens = expression.replace(/\s/g, '').split(/([+\-*/()])/).filter(t => t);
        let index = 0;

        function peek() {
            return tokens[index];
        }

        function consume() {
            return tokens[index++];
        }
        
        // RECURSIÓN: parseFactor llama a parseExpression si encuentra un paréntesis
        function parseFactor() {
            let token = consume();
            if (token === '(') {
                let result = parseExpression();
                if (consume() !== ')') throw new Error('Paréntesis no cerrado');
                return result;
            } else if (token === '-') { // Manejo de números negativos
                if(tokens[index - 2] === undefined || ['+','-','*','/','('].includes(tokens[index-2])){
                     return -parseFactor();
                }
                // Si no, es una resta y ya se manejó en parseExpression
                index--; // devolvemos el token '-' para que lo procese parseExpression
                return parseFloat(peek());
            } else {
                 if (token === undefined) throw new Error("Expresión inesperada");
                 return parseFloat(token);
            }
        }

        // RECURSIÓN: parseTerm se llama a sí mismo implícitamente a través de parseFactor
        function parseTerm() {
            let result = parseFactor();
            while (peek() === '*' || peek() === '/') {
                const operator = consume();
                const right = parseFactor();
                if (operator === '*') {
                    result *= right;
                } else {
                    if (right === 0) throw new Error("División por cero");
                    result /= right;
                }
            }
            return result;
        }

        // RECURSIÓN: parseExpression se llama a sí mismo implícitamente a través de parseTerm
        function parseExpression() {
            let result = parseTerm();
            while (peek() === '+' || peek() === '-') {
                const operator = consume();
                const right = parseTerm();
                if (operator === '+') {
                    result += right;
                } else {
                    result -= right;
                }
            }
            return result;
        }
        
        const finalResult = parseExpression();
        if (index !== tokens.length) throw new Error("Expresión inválida");

        // Formatear resultado para no tener decimales largos
        return Math.round(finalResult * 1e12) / 1e12;
    }


    // --- LÓGICA DEL JUEGO MATEMÁTICO ---
    let score = 0;
    let correctAnswer = 0;

    function generateNewProblem() {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        let problemText = `${num1} ${operator} ${num2}`;
        if (operator === '-' && num1 < num2) {
             // Evitar resultados negativos para simplificar
            problemText = `${num2} - ${num1}`;
            correctAnswer = num2 - num1;
        } else {
            // eval es seguro aquí porque nosotros controlamos los operandos
            correctAnswer = eval(problemText); 
        }

        problemEl.textContent = `${problemText.replace('*', '×')} = ?`;
        feedbackEl.textContent = '';
        answerInput.value = '';
        answerInput.focus();
    }

    checkAnswerBtn.addEventListener('click', () => {
        const userAnswer = parseInt(answerInput.value, 10);
        if (isNaN(userAnswer)) {
            feedbackEl.textContent = "Por favor, introduce un número.";
            feedbackEl.style.color = 'orange';
            return;
        }

        if (userAnswer === correctAnswer) {
            score++;
            feedbackEl.textContent = "¡Correcto!";
            feedbackEl.style.color = 'var(--active-nav-color)';
            scoreEl.textContent = score;
            setTimeout(generateNewProblem, 1000); // Nuevo problema después de 1 segundo
        } else {
            feedbackEl.textContent = `Incorrecto. La respuesta era ${correctAnswer}.`;
            feedbackEl.style.color = 'red';
            score = 0; // Reiniciar puntuación en fallo
            scoreEl.textContent = score;
            setTimeout(generateNewProblem, 2000);
        }
    });
    
    // Iniciar el juego al cargar la página (o al cambiar a la pestaña)
    if(!gamesSection.classList.contains('hidden')) {
       generateNewProblem();
    }
});