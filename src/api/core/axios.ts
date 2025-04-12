import Axios from "axios";

const axios = Axios.create({
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

export { axios };
