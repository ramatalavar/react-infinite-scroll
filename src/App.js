import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import axios from 'axios';
import { Grid, ListGroup, ListGroupItem, Media, Image } from 'react-bootstrap';

const URL = "https://api.github.com/search/repositories?q=language:";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      repositories: [],
      totalPages: 1,
      pageCount: 1,
      isFetching: true,
      hasMore: true,
      isScrollToWindow: false
    };
  }

  componentDidMount() {
    this.fetchMore();
  }

  fetchMore(scrollTop = null) {
    this.setState({
      isFetching: true
    });
    let { pageCount, totalPages } = this.state;

    if (pageCount <= totalPages) {
      let url = URL+`&page=${pageCount}`;
      axios.get(url).then((response) => {
        this.handleResponse(response, scrollTop);
      }).catch((error) => {
        console.log(error);
      });
    }
  }

  handleResponse(response, scrollTop) {
    let { items, total_count } = response.data;
    let { pageCount, repositories } = this.state;
    let repos = items.concat(repositories);
    pageCount++;
    let totalPages = Math.round(total_count/30);
    this.setState({
      repositories: repos,
      totalPages: Math.round(total_count/30),
      pageCount: pageCount,
      isFetching: false,
      hasMore: pageCount < totalPages
    });

    // retain the current scroll position
    if (this.state.isScrollToWindow) {
      window.scrollTop = scrollTop || window.scrollTop
    } else {
      this.scrollableTo.scrollTop = scrollTop || this.scrollableTo.scrollTop;
    }
  }

  render() {
    return (
      <Grid>
        <div  ref={(el) => this.scrollableTo = el} className="App">
          <header className="App-header">
            <h3 className="App-title">Welcome to React Infinite Scroll - Demo</h3>
          </header>
          <ListGroup className="list-container">
            {
              this.state.repositories.map((repo) => {
                return (
                  <ListGroupItem key={repo.id}>
                    <Media>
                      <Media.Left>
                        <a href={repo.owner.html_url} target="_blank">
                          <Image width={30} height={30} src={repo.owner.avatar_url} />
                        </a>
                      </Media.Left>
                      <Media.Body>
                        <Media.Heading>
                          <a href={repo.html_url} target="_blank">{repo.full_name}</a>
                        </Media.Heading>
                        <p>{repo.description}</p>
                      </Media.Body>
                    </Media>
                  </ListGroupItem>
                )
              })
            }
          </ListGroup>
          <InfiniteScroller
           hasMore={this.state.hasMore}
           isFetching={this.state.isFetching}
           fetchMore={this.fetchMore.bind(this)}
           scrollToWindow={this.state.isScrollToWindow} />
        </div>
      </Grid>
    );
  }
}

export default App;

class InfiniteScroller extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isScrollToWindow: props.scrollToWindow
    };
  }
  componentDidMount() {
    let scrollableTo;
    if (!this.state.isScrollToWindow) {
      scrollableTo = ReactDOM.findDOMNode(this).parentNode;
    } else {
      scrollableTo = window;
    }
    this.setState({
      scrollableTo: scrollableTo
    });
    scrollableTo.addEventListener('scroll', this.handleScroll.bind(this));
  }

  componentWillUnmount() {
    this.state.scrollableTo.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  handleScroll(){
    if (!this.props.isFetching && this.props.hasMore && this.isNearBottom()) {
      this.props.fetchMore(this.state.scrollableTo.scrollTop); // pass the current scroll position of the container
    }
  }

  isNearBottom() {
    const EPSILON = 150;
    let { scrollableTo, isScrollToWindow } = this.state;
    let viewPortTop, bottomTop;

    if(isScrollToWindow) {
      let element = window.documentElement || window.document.scrollingElement;
      viewPortTop = element.scrollTop || element.pageYOffset;
      bottomTop = element.scrollHeight - window.innerHeight;
    } else {
      viewPortTop = scrollableTo.scrollTop;
      bottomTop = scrollableTo.scrollHeight - scrollableTo.clientHeight;
    }

    this.setState({
      lastScrollPos: viewPortTop
    });

    return viewPortTop & (bottomTop - viewPortTop) < EPSILON;
  }

  render() {
    return (
      <div>
        {
          this.props.isFetching ?
          <div className="scroll-loader">
            Loading<span>.</span><span>.</span><span>.</span>
          </div> : null
        }
      </div>
    )
  }
};
