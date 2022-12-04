const { sqlForPartialUpdate }= require("./sql");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
  } = require("../models/_testCommon");
  
  beforeAll(commonBeforeAll);
  beforeEach(commonBeforeEach);
  afterEach(commonAfterEach);
  afterAll(commonAfterAll);

describe("sqlForPartialUpdate", function(){
    test("correctly generates sql for partial update", function(){
        let handle = "c1";
        let data = { 
            "name": "bingus industries",
            "description": "i changed the description",
            "numEmployees": 50000,
            "logoUrl": "https://i.imgur.com/SyrWRv1.jpeg"
        }
        let { setCols, values } = sqlForPartialUpdate(
            data,
            {
                numEmployees: "num_employees",
                logoUrl: "logo_url"
            }
        )
        expect(setCols).toEqual("\"name\"=$1, \"description\"=$2, \"num_employees\"=$3, \"logo_url\"=$4")
        expect(values).toEqual(["bingus industries", "i changed the description", 50000, "https://i.imgur.com/SyrWRv1.jpeg"])
    })
} )
