/**
 * @file  Gui
 * @author Lucas Varela, Edoardo Colares, Matheus de Medeiros, Vinicius Waltrick
 * Baseado na interface do Alexander Rose
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

 NGL.StageWidget = function (stage) {
  var viewport = new NGL.ViewportWidget(stage).setId('viewport')
  document.body.appendChild(viewport.dom)

  // ensure initial focus on viewer canvas for key-stroke listening
  stage.viewer.renderer.domElement.focus()

  var cssLinkElement = document.createElement('link')
  cssLinkElement.rel = 'stylesheet'
  cssLinkElement.id = 'theme'

  function setTheme(value) {
    var cssPath, bgColor
    if (value === 'light') {
      cssPath = NGL.cssDirectory + 'light.css'
      bgColor = 'white'
    }
    cssLinkElement.href = cssPath
    stage.setParameters({ backgroundColor: bgColor })
  }

  setTheme('light')
  document.head.appendChild(cssLinkElement)

  var overview = new NGL.OverviewWidget().setOpacity('0.9')
    .setDisplay('inline-block')
  document.body.appendChild(overview.dom)

  var sidebar = new NGL.SidebarWidget(stage).setId('sidebar')
  document.body.appendChild(sidebar.dom)

  stage.handleResize()

  stage.mouseControls.remove("drag-ctrl-left");
  stage.mouseControls.remove("drag-shift-left");

  stage.mouseControls.add("drag-ctrl-left", NGL.MouseActions.panComponentDrag);
  stage.mouseControls.add("drag-shift-left", NGL.MouseActions.panAtomDrag);

  this.overview = overview
  this.viewport = viewport
  this.sidebar = sidebar

  return this
}

NGL.ViewportWidget = function (stage) {
  var viewer = stage.viewer
  var container = new UI.Panel()
  container.dom = viewer.container
  container.setPosition('absolute')
  return container
}

NGL.OverviewWidget = function () {
  var container = new UI.OverlayPanel()
  var headingPanel = new UI.Panel()
    .setBorderBottom('1px solid #555')
    .setHeight('25px')
    .setPadding('5px')

  var listingPanel = new UI.Panel()
    .setPadding('10px')
    .setMarginTop('5px')
    .setMinHeight('100px')
    .setMaxHeight('500px')
    .setMaxWidth('600px')
    .setOverflow('auto')

  headingPanel.add(
    new UI.Text('Visualizador de moleculas').setFontStyle('italic'),
    new UI.Html('&nbsp;&mdash;&nbsp;Controles gerais')
  )
  headingPanel.add(
    new UI.Icon('times')
      .setCursor('pointer')
      .setMarginLeft('20px')
      .setFloat('right')
      .onClick(function () {
        container.setDisplay('none')
      })
  )

  container.add(headingPanel)
  container.add(listingPanel)

  //

  function addIcon(name, text) {
    var panel = new UI.Panel()

    var icon = new UI.Icon(name)
      .setWidth('20px')
      .setFloat('left')

    var label = new UI.Text(text)
      .setDisplay('inline')
      .setMarginLeft('5px')

    panel
      .setMarginLeft('20px')
      .add(icon, label)
    listingPanel.add(panel)
  }

  listingPanel
    .add(new UI.Panel().add(new UI.Html("Para carregar uma nova molecula clique em <i>Abrir modelo</i> no menu ao lado.")))
    .add(new UI.Break())

  listingPanel
  .add(new UI.Panel().add(new UI.Html("Para buscar uma molecula digite em <i>Buscar modelo PDB</i> o Id da molecula desejada. O Id pode ser encontrado no link abaixo. Ex.: 1D66 (molecula do DNA)")))
  .add(new UI.Break())

  listingPanel
  .add(new UI.Panel().add(new UI.Html("Para salvar a imagem da molecula clique em <i>Screenshot</i>.")))
  .add(new UI.Break())


  listingPanel
    .add(new UI.Text('Controles do mouse:'))
    .add(new UI.Html(
      '<ul>' +
      '<li>Botão esquerdo precionado rotaciona a camera.</li>' +
      '<li>Botão esquerdo clicado foca no atomo.</li>' +
      '<li>Scroll do mouse realiza o zoom na camera.</li>' +
      '<li>Ctrl + Botão esquerdo precionado move a molecula na tela.</li>' +
      '<li>Shift + Botão esquerdo precionado move um atomo da molecula na tela.</li>' +
      '</ul>'
    ))


  listingPanel
    .add(new UI.Panel().add(new UI.Text('Ações dos icones na molecula carregada:')))
    .add(new UI.Break())

  addIcon('eye', 'Controla a visibilidade da molecula.')
  addIcon('crosshairs', 'Centraliza a camera na molecula.')
  addIcon('trash-alt', 'Deleta a molecula. É preciso clicar duas vezes para confirmar a ação.')

  listingPanel
    .add(new UI.Break())
    .add(new UI.Panel().add(new UI.Html(
      '<strong>Para encontrar e baixar as moleculas acesse: </strong>' +
      "<a href='https://www.rcsb.org/' target='https://www.rcsb.org/'>RCSB Protein Data Bank</a>."
    )))
  return container
}

NGL.SidebarWidget = function (stage) {
  var signals = stage.signals
  var container = new UI.Panel()

  var compList = []
  var widgetList = []

  var widgetContainer = new UI.Panel().setClass('Content')
  var title = new UI.Panel().setClass('Panel Sticky').setFloat('left').add(
    new UI.Text('Visualizador de moleculas').setClass('title'))

  widgetContainer.add(new NGL.SidebarArquivoWidget(stage));

  widgetContainer.add(new NGL.SidebarCameraWidget(stage));

  signals.componentAdded.add(function (component) {
    var widget
    widget = new NGL.SidebarMoleculasWidget(component)
    widgetContainer.add(widget)
    compList.push(component)
    widgetList.push(widget)
  })

  signals.componentRemoved.add(function (component) {
    var idx = compList.indexOf(component)

    if (idx !== -1) {
      widgetList[idx].dispose()

      compList.splice(idx, 1)
      widgetList.splice(idx, 1)
    }
  })

  container.add(
    title,
    widgetContainer
  )

  return container
}

NGL.SidebarArquivoWidget = function (stage) {
  var fileTypesOpen = NGL.flatten([
    NGL.ParserRegistry.getStructureExtensions(),
    NGL.ParserRegistry.getVolumeExtensions(),
    NGL.ParserRegistry.getSurfaceExtensions(),
    NGL.DecompressorRegistry.names,
    NGL.ScriptExtensions
  ])

  function fileInputOnChange(e) {
    var fn = function (file, callback) {
      var ext = file.name.split('.').pop().toLowerCase()
      if (NGL.ScriptExtensions.includes(ext)) {
        stage.loadScript(file).then(callback)
      } else if (fileTypesOpen.includes(ext)) {
        stage.loadFile(file, { defaultRepresentation: true }).then(callback)
      } else {
        console.error('unknown filetype: ' + ext)
        callback()
      }
    }
    var queue = new NGL.Queue(fn, e.target.files)
  }

  var fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.multiple = true
  fileInput.style.display = 'none'
  fileInput.accept = '.' + fileTypesOpen.join(',.')
  fileInput.addEventListener('change', fileInputOnChange, false)

  // event handlers
  function onOpenOptionClick() {
    fileInput.click()
  }

  function onScreenshotOptionClick() {
    stage.makeImage({
      factor: 1,
      antialias: true,
      trim: false,
      transparent: false
    }).then(function (blob) {
      NGL.download(blob, 'screenshot.png')
    })
  }

  function onPdbInputKeyDown(e) {
    if (e.keyCode === 13) {
      stage.loadFile('rcsb://' + e.target.value.trim(), {
        defaultRepresentation: true
      })
      e.target.value = ''
    }
  }

  // configure menu contents
  var createOption = UI.MenubarHelper.createOption
  var createInput = UI.MenubarHelper.createInput
  var menuConfig = [
    createOption('Abrir modelo...', onOpenOptionClick, 'upload'),
    createInput('Buscar modelo PDB: ', onPdbInputKeyDown),
    createOption('Screenshot', onScreenshotOptionClick, 'camera')
  ]

  var optionsPanel = UI.MenubarHelper.createOptionsPanel(menuConfig)
  optionsPanel.dom.appendChild(fileInput)

  return UI.MenubarHelper.createMenuContainer('Arquivo', optionsPanel)
}

NGL.SidebarMoleculasWidget = function (component) {
  var container = new UI.Panel().setClass('menu')
  var componentPanel = new UI.ComponentPanel(component)

  container.add(componentPanel)

  return container
}

NGL.SidebarCameraWidget = function (stage) {
  // event handlers
  function onPerspectiveCameraOptionClick() {
    stage.setParameters({ cameraType: 'perspective' })
  }

  function onOrthographicCameraOptionClick() {
    stage.setParameters({ cameraType: 'orthographic' })
  }

  function onStereoCameraOptionClick() {
    stage.setParameters({ cameraType: 'stereo' })
  }

  function onCenterOptionClick() {
    stage.autoView(1000)
  }

  function onToggleSpinClick() {
    stage.toggleSpin()
  }

  function onToggleRockClick() {
    stage.toggleRock()
  }
  // configure menu contents

  var createOption = UI.MenubarHelper.createOption

  var menuConfig = [
    createOption('Perspectiva', onPerspectiveCameraOptionClick, 'bullseye'),
    createOption('Ortográfica', onOrthographicCameraOptionClick, 'bullseye'),
    createOption('Dividir', onStereoCameraOptionClick, 'bullseye'),
    createOption('Centralizar', onCenterOptionClick, 'bullseye'),
    createOption('Rotacionar', onToggleSpinClick, 'bullseye'),
    createOption('Alternar rotação', onToggleRockClick, 'bullseye'),
  ]

  var optionsPanel = UI.MenubarHelper.createOptionsPanel(menuConfig)

  return UI.MenubarHelper.createMenuContainer('Camera', optionsPanel)
}

