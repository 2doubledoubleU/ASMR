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
}

function articleRead(evt) {
  if (event.which != 3) {
    if ((event.target.className == "article_feed") || (event.target.className == "article_time")) {
      ajaxCall("POST","4",event.target.parentElement.childNodes[0].href);
      event.target.parentElement.style.opacity = 1 / (4 * event.target.parentElement.style.opacity)
    } else if ((event.target.className == "article_title") || (event.target.className == "article_image")) {
      ajaxCall("POST","4",event.target.parentElement.href);
      event.target.parentElement.parentElement.style.opacity = 1 / (4 * event.target.parentElement.parentElement.style.opacity)
    } else if (event.target.className == "article") {
      ajaxCall("POST","4",event.target.childNodes[0].href);
      event.target.style.opacity = 1 / (4 * event.target.style.opacity)
    } 
  }
}

function tileCreate(x) {
  x.forEach(({title,feed,link,image,added}) => {
    const Article = document.createElement("div")
    Article.className = "article"
    Article.style.opacity = 1;
    const Link = document.createElement("a") 
    Link.target = "_blank"
    Link.href = link
    const Image = document.createElement("img") 
    Image.src = image
    Image.className = "article_image"
    const Title = document.createElement("div") 
    Title.className = "article_title"
    const titleText = document.createTextNode(title)
    const Feed = document.createElement("div") 
    Feed.className = "article_feed"
    const feedText = document.createTextNode(feed)
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
  const menus = ajaxCall("POST","1");
  const subMenus = ajaxCall("POST","2");
  
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

  subMenus.forEach(({feed,category}) => {
    const subMenuLink = document.createElement("a")
    subMenuLink.category = category
    subMenuLink.feed = feed
    const subMenuText = document.createTextNode(feed)
    subMenuLink.appendChild(subMenuText)
    document.getElementById(category).appendChild(subMenuLink) 
  })

}

function getCategoryPage(evt) {
  if (event.target.id != "top_bar") {
    obj = ajaxCall("POST","3",event.target.category,event.target.feed);
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
    populateMenus()
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











