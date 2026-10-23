const display = document.querySelector("#display");
const expression = document.querySelector("#expression");
const keypad = document.querySelector("#keypad");
const operatorButtons = document.querySelectorAll("[data-operator]");

let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let shouldStartNewValue = false;
let justCalculated = false;

const operatorSymbols = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

function render() {
  display.textContent = currentValue;
  operatorButtons.forEach((button) => {
    button.classList.toggle(
      "is-selected",
      button.dataset.operator === pendingOperator && !shouldStartNewValue,
    );
  });
}

function formatResult(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const rounded = Number.parseFloat(value.toPrecision(12));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function enterDigit(digit) {
  if (currentValue === "Error" || shouldStartNewValue || justCalculated) {
    currentValue = digit;
    shouldStartNewValue = false;
    justCalculated = false;
    if (!pendingOperator) {
      expression.textContent = "";
    }
  } else if (currentValue === "0") {
    currentValue = digit;
  } else if (currentValue === "-0") {
    currentValue = `-${digit}`;
  } else if (currentValue.replace("-", "").length < 15) {
    currentValue += digit;
  }
  render();
}

function enterDecimal() {
  if (currentValue === "Error" || shouldStartNewValue || justCalculated) {
    currentValue = "0.";
    shouldStartNewValue = false;
    justCalculated = false;
    if (!pendingOperator) {
      expression.textContent = "";
    }
  } else if (!currentValue.includes(".")) {
    currentValue += ".";
  }
  render();
}

function calculate(left, right, operator) {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right === 0 ? null : left / right;
    default:
      return null;
  }
}

function chooseOperator(operator) {
  if (currentValue === "Error") {
    clearCalculator();
  }

  const input = Number(currentValue);
  if (pendingOperator && !shouldStartNewValue && storedValue !== null) {
    const result = calculate(storedValue, input, pendingOperator);
    const formatted = result === null ? null : formatResult(result);
    if (formatted === null) {
      showError();
      return;
    }
    currentValue = formatted;
    storedValue = result;
  } else {
    storedValue = input;
  }

  pendingOperator = operator;
  shouldStartNewValue = true;
  justCalculated = false;
  expression.textContent = `${currentValue} ${operatorSymbols[operator]}`;
  render();
}

function showError() {
  currentValue = "Error";
  storedValue = null;
  pendingOperator = null;
  shouldStartNewValue = true;
  justCalculated = false;
  expression.textContent = "Cannot divide by zero";
  render();
}

function pressEquals() {
  if (!pendingOperator || storedValue === null || shouldStartNewValue) {
    return;
  }

  const left = storedValue;
  const right = Number(currentValue);
  const operator = pendingOperator;
  const result = calculate(left, right, operator);
  const formatted = result === null ? null : formatResult(result);

  if (formatted === null) {
    showError();
    return;
  }

  expression.textContent = `${left} ${operatorSymbols[operator]} ${right} =`;
  currentValue = formatted;
  storedValue = null;
  pendingOperator = null;
  shouldStartNewValue = true;
  justCalculated = true;
  render();
}

function clearCalculator() {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  shouldStartNewValue = false;
  justCalculated = false;
  expression.textContent = "";
  render();
}

function deleteLastDigit() {
  if (currentValue === "Error") {
    clearCalculator();
    return;
  }
  if (shouldStartNewValue || justCalculated) {
    return;
  }

  currentValue = currentValue.length <= 1 || (currentValue.length === 2 && currentValue.startsWith("-"))
    ? "0"
    : currentValue.slice(0, -1);
  render();
}

function changeSign() {
  if (currentValue === "Error" || Number(currentValue) === 0) {
    return;
  }
  currentValue = currentValue.startsWith("-") ? currentValue.slice(1) : `-${currentValue}`;
  render();
}

function applyPercent() {
  if (currentValue === "Error" || shouldStartNewValue) {
    return;
  }
  const value = Number(currentValue) / 100;
  const formatted = formatResult(value);
  if (formatted !== null) {
    currentValue = formatted;
    render();
  }
}

function handleAction(action) {
  switch (action) {
    case "clear":
      clearCalculator();
      break;
    case "delete":
      deleteLastDigit();
      break;
    case "decimal":
      enterDecimal();
      break;
    case "equals":
      pressEquals();
      break;
    case "sign":
      changeSign();
      break;
    case "percent":
      applyPercent();
      break;
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  button.classList.add("pressed");
  window.setTimeout(() => button.classList.remove("pressed"), 140);

  if (button.dataset.digit !== undefined) {
    enterDigit(button.dataset.digit);
  } else if (button.dataset.operator) {
    chooseOperator(button.dataset.operator);
  } else if (button.dataset.action) {
    handleAction(button.dataset.action);
  }
});

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) {
    enterDigit(event.key);
  } else if (event.key === "." || event.key === ",") {
    enterDecimal();
  } else if (Object.hasOwn(operatorSymbols, event.key)) {
    chooseOperator(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    pressEquals();
  } else if (event.key === "Backspace") {
    deleteLastDigit();
  } else if (event.key === "Escape" || event.key === "Delete") {
    clearCalculator();
  } else if (event.key === "%") {
    applyPercent();
  }
});

render();
