Object.defineProperty(HTMLElement.prototype, 'doc', {
  get() { return this.ownerDocument; },
});

function createElement(this: HTMLElement, tag: string, options: {
  cls?: string; text?: string; attr?: Record<string, string>;
} = {}) {
  const element = this.ownerDocument.createElement(tag);
  if (options.cls) element.className = options.cls;
  if (options.text) element.textContent = options.text;
  for (const [name, value] of Object.entries(options.attr ?? {})) element.setAttribute(name, value);
  this.append(element);
  return element;
}

Object.assign(HTMLElement.prototype, {
  createEl: createElement,
  createDiv(this: HTMLElement, options: object) { return createElement.call(this, 'div', options); },
  createSpan(this: HTMLElement, options: object) { return createElement.call(this, 'span', options); },
});
