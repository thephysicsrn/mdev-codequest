// ==========================================================================
// CODE EDITOR COMPONENT - MDEV CODEQUEST
// Editor de código Python com syntax highlighting, números de linha e atalhos
// ==========================================================================

export class EditorComponent {
  constructor(textareaEl, highlightEl, lineNumbersEl, activeMarkerEl, paletteEl) {
    this.textarea = textareaEl;
    this.highlight = highlightEl;
    this.lineNumbers = lineNumbersEl;
    this.activeMarker = activeMarkerEl;
    this.palette = paletteEl;

    this.initEvents();
  }

  initEvents() {
    // Sincroniza digitação com highlight e números de linha
    this.textarea.addEventListener('input', () => {
      this.updateHighlight();
      this.updateLineNumbers();
    });

    // Sincroniza scroll entre textarea e o highlight espelhado
    this.textarea.addEventListener('scroll', () => {
      this.highlight.scrollTop = this.textarea.scrollTop;
      this.highlight.scrollLeft = this.textarea.scrollLeft;
      this.lineNumbers.scrollTop = this.textarea.scrollTop;
    });

    // Tratamento de Teclas Especiais (Tab e Enter com indentação Python)
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;
        this.textarea.value = val.substring(0, start) + '    ' + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
        this.updateHighlight();
        this.updateLineNumbers();
      } else if (e.key === 'Enter') {
        // Auto-indentação inteligente para Python
        const start = this.textarea.selectionStart;
        const val = this.textarea.value;
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const currentLine = val.substring(lineStart, start);
        const indentMatch = currentLine.match(/^(\s*)/);
        let indent = indentMatch ? indentMatch[1] : '';

        // Se a linha anterior terminou com dois pontos ':', adiciona 4 espaços a mais
        if (currentLine.trim().endsWith(':')) {
          indent += '    ';
        }

        if (indent.length > 0) {
          e.preventDefault();
          this.textarea.value = val.substring(0, start) + '\n' + indent + val.substring(start);
          this.textarea.selectionStart = this.textarea.selectionEnd = start + 1 + indent.length;
          this.updateHighlight();
          this.updateLineNumbers();
        }
      }
    });
  }

  // Define o código no editor
  setCode(code) {
    this.textarea.value = code;
    this.updateHighlight();
    this.updateLineNumbers();
    this.setActiveLine(null);
  }

  // Pega o código atual
  getCode() {
    return this.textarea.value;
  }

  // Retorna a quantidade de linhas que contém comandos reais
  getEffectiveLineCount() {
    return this.textarea.value
      .split('\n')
      .filter(l => l.trim().length > 0 && !l.trim().startsWith('#'))
      .length;
  }

  // Destaca a linha em execução em tempo real
  setActiveLine(lineNum) {
    if (!lineNum || lineNum < 1) {
      this.activeMarker.classList.add('hidden');
      const activeNums = this.lineNumbers.querySelectorAll('.active-line-num');
      activeNums.forEach(el => el.classList.remove('active-line-num'));
      return;
    }

    this.activeMarker.classList.remove('hidden');
    // Altura de linha = 24px, padding superior = 14px
    const topPos = 14 + (lineNum - 1) * 24 - this.textarea.scrollTop;
    this.activeMarker.style.top = `${topPos}px`;

    // Atualiza classe no número de linha
    const lineSpans = this.lineNumbers.querySelectorAll('.line-number');
    lineSpans.forEach((span, idx) => {
      if (idx + 1 === lineNum) {
        span.classList.add('active-line-num');
      } else {
        span.classList.remove('active-line-num');
      }
    });
  }

  // Atualiza os números de linha à esquerda
  updateLineNumbers() {
    const lines = this.textarea.value.split('\n');
    let html = '';
    for (let i = 1; i <= lines.length; i++) {
      html += `<div class="line-number">${i}</div>`;
    }
    this.lineNumbers.innerHTML = html;
  }

  // Atualiza o syntax highlighting em tempo real
  updateHighlight() {
    const raw = this.textarea.value;
    const highlighted = this.highlightPython(raw);
    const codeTag = this.highlight.querySelector('code');
    if (codeTag) {
      codeTag.innerHTML = highlighted + '\n';
    }
  }

  // Colorizador de sintaxe Python seguro e rápido
  highlightPython(code) {
    // Escapa caracteres HTML
    let text = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Strings: "..." ou '...'
    text = text.replace(/(".*?"|'.*?')(?!([^<]*>))/g, '<span class="syn-string">$1</span>');

    // 2. Comentários: # ...
    text = text.replace(/(#.*?)$/gm, '<span class="syn-comment">$1</span>');

    // 3. Palavras-chave do Python
    const keywords = ['for', 'in', 'while', 'if', 'elif', 'else', 'def', 'return', 'not', 'and', 'or', 'pass', 'break'];
    keywords.forEach(kw => {
      const reg = new RegExp(`\\b(${kw})\\b`, 'g');
      text = text.replace(reg, '<span class="syn-keyword">$1</span>');
    });

    // 4. Booleanos
    text = text.replace(/\b(True|False)\b/g, '<span class="syn-boolean">$1</span>');

    // 5. Funções embutidas
    text = text.replace(/\b(range|print|len)\b/g, '<span class="syn-builtin">$1</span>');

    // 6. Entidade 'heroi'
    text = text.replace(/\b(heroi|hero)\b/g, '<span class="syn-hero">$1</span>');

    // 7. Métodos mágicos do herói
    const methods = [
      'andar_direita', 'andar_esquerda', 'andar_cima', 'andar_baixo',
      'move_right', 'move_left', 'move_up', 'move_down',
      'moveRight', 'moveLeft', 'moveUp', 'moveDown',
      'coletar', 'collect', 'pick',
      'atacar', 'attack', 'hit',
      'abrir_porta', 'open_door', 'openDoor',
      'tem_inimigo', 'has_enemy', 'hasEnemy',
      'tem_chave', 'has_key', 'hasKey',
      'caminho_livre', 'is_path_clear', 'isPathClear',
      'tem_joia', 'has_gem', 'hasGem',
      'chegou_ao_tesouro', 'reached_goal'
    ];
    methods.forEach(m => {
      const reg = new RegExp(`\\.(${m})\\(`, 'g');
      text = text.replace(reg, '.<span class="syn-method">$1</span>(');
    });

    // 8. Números
    text = text.replace(/\b(\d+)\b/g, '<span class="syn-number">$1</span>');

    return text;
  }

  // Preenche a paleta de feitiços com base na fase atual
  renderSpellsPalette(spells) {
    this.palette.innerHTML = '';
    if (!spells || spells.length === 0) return;

    spells.forEach(spell => {
      const btn = document.createElement('button');
      btn.className = `spell-btn ${spell.type}-spell`;
      btn.textContent = `+ ${spell.label}`;
      btn.title = `Inserir ${spell.label} no código`;

      btn.addEventListener('click', () => {
        this.insertSnippet(spell.code);
      });

      this.palette.appendChild(btn);
    });
  }

  // Insere um snippet na posição do cursor
  insertSnippet(snippet) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const val = this.textarea.value;

    this.textarea.value = val.substring(0, start) + snippet + val.substring(end);
    this.textarea.selectionStart = this.textarea.selectionEnd = start + snippet.length;
    this.textarea.focus();

    this.updateHighlight();
    this.updateLineNumbers();
  }
}
