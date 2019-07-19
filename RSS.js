let scope = 0

function timeSince(t) {
  mills = new Date()-Date.parse(t)
  d = new Date(t)
  if (mills < 0) {
    return "error"
  } else if (mills < 864e5) {
    return d.getHours() + ":" + ("0" + d.getMinutes()).slice(-2)
  } else if (mills < 1728e5) {
    return "yesterday"
  } else if (mills < 9504e5) {
    return Math.floor(mills/864e5) + "d"    
  } else {
    return 1900+d.getYear() + "-" + ("0" + (d.getMonth()+1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2)
  }
}

function modder() {
  document.getElementById("popup").style.display = "flex"
  document.getElementById("blocker").style.display = "block"
  showMod()
}

function closeModder() {
  document.getElementById("popup").style.display = "none"
  document.getElementById("blocker").style.display = "none"
}

function ajaxCall(type, ...inputs) {
  const http = new XMLHttpRequest();
  const form_data = new FormData();
  for(input in inputs) {
    form_data.append(input,inputs[input])
  }
  http.open(type, 'RSS.php',false) //fix this to be async 
  http.send(form_data);
  return JSON.parse(http.responseText)
}

function sectionRead() {
  const category = document.getElementById("insertion").category 
  const feed = document.getElementById("insertion").feed
  const time = document.getElementById("insertion").time //used to make sure new articles are not marked as read before shown 
  ajaxCall("POST","5",category,feed,time);
  Array.from(document.getElementsByClassName("article")).forEach(({style}) => {
    style.opacity = 0.25
  })
  populateMenus()
}

function toggler() {
  scope = (scope + 1) % 2
  populateMenus()
  document.getElementById("default").click();
}

function articleRead(evt) {
  if (event.which != 3) {
    if ((event.target.className == "article_feed") || (event.target.className == "article_time")) {
      ajaxCall("POST","4",decodeURIComponent(event.target.parentElement.childNodes[0].href),4*(event.target.parentElement.style.opacity-0.25)/3); //mark as read (1) or unread (0) based on opacity
      event.target.parentElement.style.opacity = 1 / (4 * event.target.parentElement.style.opacity) //flip opacity between 0.25 and 1
    } else if ((event.target.className == "article_title") || (event.target.className == "article_image")) {
      ajaxCall("POST","4",decodeURIComponent(event.target.parentElement.href),4 * (event.target.parentElement.parentElement.style.opacity-0.25)/3);
      event.target.parentElement.parentElement.style.opacity = 1 / (4 * event.target.parentElement.parentElement.style.opacity)
    } else if (event.target.className == "article") {
      ajaxCall("POST","4",decodeURIComponent(event.target.childNodes[0].href),4*(event.target.style.opacity-0.25)/3);
      event.target.style.opacity = 1 / (4 * event.target.style.opacity)
    }
    populateMenus() 
  }
}

function tileCreate(x) {
  x.forEach(({title,feed_name,link,image,added,read}) => {
    const Article = document.createElement("div")
    Article.className = "article"
    Article.style.opacity = 1 - read*0.75;
    const Link = document.createElement("a") 
    Link.target = "_blank"
    Link.href = link
    const Image = document.createElement("img") 
    Image.src = image
    Image.onerror = function () {
      this.onerror=null;
      this.src='noImage.png';
    }
    Image.className = "article_image"
    const Title = document.createElement("div") 
    Title.className = "article_title"
    const titleText = document.createTextNode(title)
    const Feed = document.createElement("div") 
    Feed.className = "article_feed"
    const feedText = document.createTextNode(feed_name)
    const Time = document.createElement("div") 
    Time.className = "article_time"
    const timeText = document.createTextNode(timeSince(added))
    Title.appendChild(titleText)
    Feed.appendChild(feedText)
    Time.appendChild(timeText)
    Link.appendChild(Image)
    Link.appendChild(Title)
    Article.appendChild(Link)
    Article.appendChild(Feed)
    Article.appendChild(Time)
    document.getElementById("insertion").appendChild(Article)
  })
}

function populateMenus() {
  const menus = ajaxCall("POST","1",scope);
  const subMenus = ajaxCall("POST","2",scope);
  
  const allButton = document.createElement("li")
  allButton.category = ''
  allButton.feed = ''
  const allText = document.createTextNode("All")
  allButton.className = "topbutton"
  allButton.id = "default"
  allButton.appendChild(allText)
  document.getElementById("top_bar").innerHTML = ''
  document.getElementById("top_bar").appendChild(allButton)

  menus.forEach(({category, amount}) => {
    const dropDiv = document.createElement("div")
    dropDiv.className = "dropdown-content"
    dropDiv.id = category
    const MenuButton = document.createElement("button")
    const MenuLink = document.createElement("li")
    MenuButton.category = category
    MenuButton.feed = ''
    const MenuText = document.createTextNode(category+" ("+amount+")")
    MenuButton.className = "topbutton"
    MenuLink.appendChild(MenuButton)
    MenuButton.appendChild(MenuText)
    MenuLink.appendChild(dropDiv)
    document.getElementById("top_bar").appendChild(MenuLink)
  })

  subMenus.forEach(({feed_name,category}) => {
    const subMenuLink = document.createElement("a")
    subMenuLink.category = category
    subMenuLink.feed = feed_name
    const subMenuText = document.createTextNode(feed_name)
    subMenuLink.appendChild(subMenuText)
    document.getElementById(category).appendChild(subMenuLink) 
  })

  menu_count = ajaxCall("POST","3",0,'','').length

}

function getCategoryPage(evt) {
  if (event.target.id != "top_bar") {
    obj = ajaxCall("POST","3",scope,event.target.category,event.target.feed);
    document.getElementById("insertion").innerHTML = ''
    document.getElementById("insertion").category = event.target.category
    document.getElementById("insertion").feed = event.target.feed
    if (obj === undefined || obj.length == 0) {
      document.getElementById("insertion").time = ''
    } else {
      document.getElementById("insertion").time = obj[0].added
    }
    cards = Math.min(obj.length,60)
    tileCreate(obj.slice(0,cards))
    document.title = "RSS Reader"
    document.getElementById("updater").style.display = "none"
    populateMenus()
  }
}

function editor(evt) {
  if (event.target.title == "Edit This Feed") {
    alert("edit me")
  } else if (event.target.title == "Remove This Feed") {
    confirmation = window.confirm("Are you certain you wish to delete this feed?");
    if (confirmation) {
      obj = ajaxCall("POST","7",event.target.parentElement.feed_name,event.target.parentElement.category,event.target.parentElement.feed);
      showMod()
    }
  } else if (event.target.title == "Add New Feed") {
    obj = ajaxCall("POST","8",document.getElementById("new_name_data").value,document.getElementById("new_cat_data").value,document.getElementById("new_feed_data").value);
    showMod()
    alert("Feed Added")
  }
}

document.getElementById("top_bar").addEventListener('click', () => getCategoryPage(event))

document.getElementById("insertion").addEventListener('mouseup', () => articleRead(event))

populateMenus()

document.getElementById("default").click();

function scroller() {
  element = document.getElementById("insertion");
  if (element.scrollHeight - element.scrollTop < element.clientHeight + 600) {
    z = cards
    cards = Math.min(obj.length,z+60)
    tileCreate(obj.slice(z,cards))
  }

}

document.getElementById("insertion").onscroll = function() {scroller()};

function checker() {
  if (ajaxCall("POST","3",0,'','').length > menu_count) {
    document.getElementById("updater").style.display = "block"
    document.title = "RSS Reader (" + (ajaxCall("POST","3",0,'','').length - menu_count) + ")"
  }
}

function updater() {
  obj = ajaxCall("POST","3",0,document.getElementById("insertion").category,document.getElementById("insertion").feed);
  document.getElementById("insertion").innerHTML = ''
  document.getElementById("insertion").time = obj[0].added
  cards = Math.min(obj.length,60)
  tileCreate(obj.slice(0,cards))
  populateMenus()
  document.getElementById("updater").style.display = "none"
  document.title = "RSS Reader"
}

function showMod() {
  document.getElementById("popup_display").innerHTML = ""
  const cats = ajaxCall("POST","6");
  const table = document.createElement("table");

  const row = table.insertRow();
  new_name = document.createElement('input')
  new_name.id = "new_name_data"
  new_name.placeholder = "Add"
  new_cat = document.createElement('input')
  new_cat.id = "new_cat_data"
  new_cat.placeholder = "New"
  new_feed = document.createElement('input')
  new_feed.id = "new_feed_data"
  new_feed.placeholder = "Feed"
  row.insertCell().appendChild(new_name);
  row.insertCell().appendChild(new_cat);
  row.insertCell().appendChild(new_feed);

  save = document.createTextNode('\uD83D\uDCBE')
  const flop = row.insertCell()
  flop.appendChild(save);
  flop.setAttribute('title', "Add New Feed");

  cats.forEach(({feed_name,category,feed}) => {
    const row = table.insertRow();
    row.feed_name = feed_name
    row.category = category
    row.feed = feed
    row.insertCell().appendChild(document.createTextNode(feed_name));
    row.insertCell().appendChild(document.createTextNode(category));
    feedLink = document.createElement('a')
    feedLink.target = '_blank'
    feedLink.href = feed
    feedLink.appendChild(document.createTextNode(feed))
    row.insertCell().appendChild(feedLink);
    
    //edits = document.createTextNode('\u270E')
    //const pen = row.insertCell()
    //pen.appendChild(edits);
    //pen.setAttribute('title', "Edit This Feed");

    deletes = document.createTextNode('\u274C')
    const cross = row.insertCell()
    cross.appendChild(deletes)
    cross.setAttribute('title', "Remove This Feed")
  })
  const thead = table.createTHead();
  const trow = thead.insertRow();
  ["Feed Name","Category","Link"].forEach((value) => {
    const th = document.createElement("th");
    let text = document.createTextNode(value);
    th.appendChild(text);
    trow.appendChild(th);
  })

  document.getElementById("popup_display").appendChild(table)
}

document.getElementById("popup_display").addEventListener('mouseup', () => editor(event))

var t=setInterval(checker,10000);
