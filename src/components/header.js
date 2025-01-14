import { Link, navigate, useStaticQuery, graphql } from "gatsby"
import PropTypes, { element } from "prop-types"
import React, { useState, useEffect } from "react";
import logo from './../assets/logo-bottom.png';
import Cart from './../components/cart/cart';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { checkLogin, logout } from "./../services/headerServices";
import { searchServices, getCartCount, viewCartItems } from "./../utils/apiServices";
import axios from "axios";
import { getProductURL, getCategoryURL } from "./../utils/url";
import img1 from './../assets/profile_img.png';
import Table from 'react-bootstrap/Table';
import Modal from 'react-bootstrap/Modal';
import { ToastContainer, toast } from 'react-toastify';
import { IoMailOutline } from "react-icons/io5";
import { IoCallOutline } from "react-icons/io5";
import Sidebar from './../components/Sidebar/sidebar';
import { IoMenuOutline, IoCloseSharp } from "react-icons/io5";
import closeSearch from './../assets/close.png';
import classNames from 'classnames';
import './layout.css';

const Header = ({ siteTitle, cartCount, allCategory }) => {

  const [isuserlogged, setIsLogged] = useState(false);
  const [search, setSearch] = useState("");
  const [activeClass, setActiveClass] = useState(false);
  const [searchResponse, setSearchRes] = useState([]);
  // Show profile Modal
  const [show, setShow] = useState(false);
  const [quoteId, setQuoteId] = useState("");
  const [jwt, setJwt] = useState("")
  const [user_name, setName] = useState("")
  const [bulkOrder, setBulkOrder] = useState([{ "sku": "", "qty": "" , "mes" : ""}, { "sku": "", "qty": "" , "mes" : "" }, { "sku": "", "qty": "" , "mes" : "" }, { "sku": "", "qty": "" , "mes" : "" }])
  // for user profile
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState({});
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [mobileShow, setMobileShow] = useState(false);
  const [value, setValue] = useState();
  const [cartCnt, setCartCnt] = useState(cartCount)
  

  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [addCartBtn, setCartBtn] = useState(false)

  useEffect(() => {
    setIsLogged(checkLogin());
    setQuoteId(localStorage.cartId);
    setJwt(localStorage.userToken);
    setEmail(localStorage.email);
    setName(localStorage.getItem('user_name'))
  }, [])


  const getProfile = () => {
    if (jwt) {
      axios({
        method: 'post',
        url: `${process.env.GATSBY_CART_URL_STARCARE}customerprofile/${email}`,
      }).then((res) => {
        if (res.statusText === "OK" && res.status == 200) {
          setProfile(res.data[0]);
          setShow(true);
        }
      }).catch((err) => {
        console.error(err);
      })
    }
  }

  const onSubmit = event => {
    event.preventDefault();
    if (search.trim().length) {
      navigate(`/search?keyword=${search}`);
      setSearch("");
      setActiveClass(false);
    }
  };

  const handleClick = async event => {
    setSearch(event.target.value);
    localStorage.setItem('searchString', event.target.value)
    var boolVal = (event.target.value.length == 0 ? false : true)
    setActiveClass(boolVal);
    if (boolVal) {
      
      setTimeout(async () => {
        setSearchRes(await searchServices(localStorage.getItem('searchString')));
      }, 500)
      
    };
  }

  const cat = [];
  const catRoute = [];
  const sampleVar = () => {
    if (searchResponse) {
      searchResponse.map((item, index) => (
        item.map((val, index) => {
          if (val.items) {
            if (!cat.includes(val.items.category_name)) {
              cat.push(val.items.category_name)
              catRoute.push({ name: val.items.category_name, id: val.items.category_id })
            }
          }
        })
      ))
      return <div><h1>Category Value</h1>
        {
          catRoute.map((catVal, index) => (
            <Link to={getCategoryURL(catVal)}><p className="categories_list">{catVal ? catVal.name : 'No Product Found'}</p></Link>
          ))
        }
      </div>
    }
  }

  const searchList = () => {

    if (searchResponse) {

      return <div>
        {
          searchResponse.map((item, index) => (
            <ul key={index}>{
              item.map((val, index) => (
                (val.items ? <li key={`${index}_item`}><Link to={getProductURL(val.items)} onClick={() => setActiveClass(false)}>
                  <span className="searchImg_holder"><img src={val.items.image} className="search-img" /></span>
                  <p className="srch_txt">{val.items.name}</p></Link></li> : '')
              ))
            }
            </ul>
          ))
        }
      </div>

    } else {
      return <div>No Product found</div>
    }

  }

  const navigateOnclick = (value) => {
    if (isuserlogged) {
      navigate(value)
    } else {
      navigate('/signin')
    }
  }
  const handleChange = (event, i) => {
    const { name, value } = event.target;
    let orders = [...bulkOrder];
    orders[i] = { ...orders[i], [name]: value};
    setBulkOrder(orders); 
    if(orders[i]['sku'] === ''){
      setCartBtn(true);
      orders[i]['mes'] = "Enter Valid SKU";
      orders[i]['qty'] = " ";
    }else if(name === 'qty'){
        orders[i]['mes'] = " ";
        setCartBtn(false);
        axios.get( 
          `${process.env.GATSBY_CART_URL}admin/minmaxqtybulk/${orders[i]['sku']}`
        ).then(async (data) => {
          if(data.status == 200){
            await setMin(Math.round(data.data[0].min_sale_qty));
            await setMax(Math.round(data.data[0].max_sale_qty));
            if(value > max)
            {orders[i]['mes'] = `Maximum Qty is ${max}`;setCartBtn(true);}
            else if(value < min)
            {orders[i]['mes'] = `Minimum Qty is ${min}`;setCartBtn(true);}
            else{orders[i]['mes'] = " ";setCartBtn(false);}
          }
        })
    }else{
      orders[i]['mes'] = " ";
      setCartBtn(false);
    }
  }

  const clearSearchValue = () => {
    setSearch("");
    setActiveClass(false);
  }

  const validateBulkOrder = () => {
    let checkIsEmpty = false;
    for (var i = 0; i < bulkOrder.length; i++) {
      if (bulkOrder[i].sku == '' || bulkOrder[i].qty == '') {
        checkIsEmpty = true;
      }
    }
    if (!checkIsEmpty) {
      addToBulkOrder();
    } else {
      toast.error('Item number missed to entered')
    }
  }

  const addToBulkOrder = () => {
    let skuStr = bulkOrder.map((val, index) => {  
      
      return val.sku;
    }).filter(Boolean).join(',');
    let qtyStr = bulkOrder.map((val, index) => {
      return val.qty;
    }).filter(Boolean).join(',');
    let bulkData = {
      "data": {
        "sku": skuStr.trim(),
        "qty": qtyStr.trim(),
        "quote_id": quoteId,
        "token": jwt
      }
    }

    if (bulkData.data.sku === "" || bulkData.data.qty === "") {
      toast.success('Required field missing')
    } else {
      try {
        axios({
          method: 'post',
          url: `${process.env.GATSBY_CART_URL_STARCARE}bulkorder/`,
          headers: {
            'Authorization': `Bearer ${jwt}`
          },
          data: bulkData
        }).then((res) => {
          if (res.statusText === "OK" && res.status == 200) {
            viewCartItems();
            setTimeout(() => {
              setCartCnt(getCartCount());
            }, 500)
            toast.success('Items added sucessfully')
          }
        }).catch((err) => {
          console.error(err)
          toast.error('SignIn to add BulkOrder')
        })
      }
      catch (err) {
        console.error(err)
      }
    }

  }

  const logout = () => {
    setIsLogged(false)
    localStorage.clear();
    setValue({})
    navigate('/')  

  }

  const renderCategories = (type) => {

    const elements_in_each_row = Math.round(allCategory.length / 3);
    const list = [];
    const topSelected = [];

    for (let i = 0; i < allCategory.length; i += elements_in_each_row) {
      list.push(allCategory.slice(i, i + elements_in_each_row));
    }

    for (let i = 0; i < 6; i++) {
      topSelected.push([allCategory[i]]);
    }

    if (type === 'dropdown') {
      return <div className="itm_list_holder">
        {
          list.map((el, index) => (
            el.map(item => (
              <figure key={item.node.id} className="itm_list">
                <Link to={getCategoryURL(item.node)} className="itm_list_title">{item.node.name}</Link>
                {
                  item.node.grand_child.map(grand_child => (
                    <span key={grand_child.id} ><Link to={getCategoryURL(grand_child)} >{grand_child.name}</Link></span>
                  ))
                }

              </figure>
            ))
          ))
        }
      </div>
    }

    if (type === 'topList')
      return <div>
        {
          topSelected.map((el, index) => (
            el.map(item => (
              <Link to={getCategoryURL(item.node)} key={item.node.id}
                activeClassName="active" >{item.node.name}</Link>
            ))
          ))
        }
      </div>
  }
  
  return (

    <header>
      {/* <div className="d-none d-md-none d-lg-block"> */}
      <div>
        <Navbar className="upper_header">
          <div className="container">   
            <Nav className="mr-auto">
              <Nav.Link className="p-0" href="mailto:ishwarya@altiussolution.com" > <IoMailOutline />ishwarya@altiussolution.com</Nav.Link>
              {<Nav.Link className="p-0" href="#home"><IoCallOutline />+1-947-800-8844</Nav.Link>}
            </Nav>
            <div className="user_accounts_links"><Link to="/">Home</Link></div> &nbsp;
            <div className="user_top"><span >{isuserlogged ? `Welcome! ${user_name}` : <div></div>}</span></div>

            <Navbar className="bulkorder my_account">
              <div className="user_accounts_links">
                {!isuserlogged && <Link to="/signup">Register</Link>}
                {!isuserlogged && <Link to="/signin">Login</Link>}
              </div>
              <div className="dropdown">
                <a className="btn dropbtn">My Account</a>
                <div className="dropdown-content">
                  <ul>
                    {isuserlogged && <li onClick={() => { logout() }}>Logout</li>}

                    <li onClick={() => { navigateOnclick('/cart') }}>My Cart</li>
                    <li onClick={() => { navigateOnclick('/orders') }}>My Orders</li>
                    <li onClick={() => { navigateOnclick('/wishlist') }}>My Wishlist</li>
                    <li onClick={() => { navigateOnclick('/compareList') }}>Compare List</li>
                    <li onClick={() => { navigateOnclick('/changePassword') }}>Change Password</li>
                    {/* <li onClick={() => { navigateOnclick('/setting') }}>Setting</li> */}
                    {isuserlogged && <li onClick={getProfile}>My Profile</li>}
                    {isuserlogged && <li onClick={() => { navigateOnclick('/myquotes') }}>My Quotes</li>}
                  </ul>

                </div>

              </div>
            </Navbar>
          </div>
        </Navbar>
        <Navbar className="middlenavbar" expand="lg">
          <div className="container">
            <Navbar.Brand className="logo">
              <Link to="/">
                <img src={logo}></img>
              </Link>
              <div className="mobile_header d-lg-none d-md-block">
                <button onClick={() => setMobileShow(mobileShow == true ? false : true)}>{mobileShow == true ? <IoCloseSharp /> : <IoMenuOutline />}</button>
                {
                  mobileShow && <Sidebar />
                }
              </div>
            </Navbar.Brand>
            <Navbar className="bulkorder all_categories_list">
              <div className="dropdown">
                <a className="btn dropbtn">All Categories</a>
                <div className="dropdown-content">
                  <ul className="categories_dropdown">
                    {renderCategories('dropdown')}
                  </ul>
                </div>
              </div>
            </Navbar>
            <form className="w-100 d-flex mr-1 t_search" onSubmit={onSubmit}>
              <input
                className="search"
                type="text"
                placeholder="Search By Products"
                value={search}
                onChange={handleClick}
              />
              <input
                type="submit"
                value="Search"
                className=" search_submit px-6 py-3 cursor-pointer"
              />

        {  activeClass == true ?
             <img src={closeSearch}
                className="px-6 py-3 cursor-pointer search_clear"
                onClick={clearSearchValue}
              /> :<></>
            }
            </form>
            
            <div className={`${activeClass ? "sampleDropDown" : "d-none"}`}>
              {sampleVar()}
              {searchList()}
            </div>
            <Cart cartCount={cartCount} />
            <Navbar className="bulkorder">
              <div className="dropdown">
                <button className="btn dropbtn">Bulk Order</button>
                <div className="dropdown-content">
                  <h1>Add Items</h1>
                  {
                    bulkOrder.map((val, index) => (

                      <div key={index} className="item_entry">
                        <div className="form-group">
                          <input placeholder="SKU" name="sku" value={val.sku || ''} onChange={e => { handleChange(e, index) }} />
                          <input placeholder="Qty" name="qty" value={val.qty || ''} onChange={e => { handleChange(e, index) }} />
                        </div>
                        <span className="text-danger">{val.mes}</span>
                        <div className="clearfix"></div>
                      </div>
                    ))
                  }
                  <button onClick={addToBulkOrder} className="btn add_btn btn_gray" disabled={addCartBtn}>Add to cart</button>
                  <Nav.Link onClick={() => { navigateOnclick('/bulkOrder') }}>Add More Items</Nav.Link>
                </div>
              </div>
            </Navbar>
          </div>
        </Navbar>

      </div>



      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        className="profile_modal">
        <Modal.Header closeButton>
          <Modal.Title>Profile Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="profile_sec">
            <div className="profile_pic">
              <img src={img1} />
            </div>

            <Table>
              <tbody>
                <tr>
                  <th>Firstname</th>
                  <td>:</td>
                  <td>{jwt && profile.firstname}</td>
                </tr>

                <tr>
                  <th>Lastname</th>
                  <td>:</td>
                  <td>{jwt && profile.lastname}</td>
                </tr>

                <tr>
                  <th>Email</th>
                  <td>:</td>
                  <td>{jwt && profile.email}</td>
                </tr>
              </tbody>
            </Table>
          </div>
        </Modal.Body>
      </Modal>


      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />


    </header>

  )
}

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header

