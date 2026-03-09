import * as http from "http";
import router from "../src/router";

function fakeReq(method: string, url: string): http.IncomingMessage {
  return ({ method, url, headers: {} } as unknown) as http.IncomingMessage;
}

const handler = () => {};

const match = router({
  GET: {
    "/dbs/:db_id": handler,
    "/dbs/:db_id/colls/:coll_id": handler
  }
});

describe("router", () => {
  it("matches a path without trailing slash", () => {
    const result = match(fakeReq("GET", "/dbs/mydb"));
    expect(result).toBeDefined();
    expect(result![0]).toEqual({ db_id: "mydb" });
  });

  it("matches a path with a single trailing slash", () => {
    const result = match(fakeReq("GET", "/dbs/mydb/"));
    expect(result).toBeDefined();
    expect(result![0]).toEqual({ db_id: "mydb" });
  });

  it("matches a path with multiple trailing slashes", () => {
    const result = match(fakeReq("GET", "/dbs/mydb///"));
    expect(result).toBeDefined();
    expect(result![0]).toEqual({ db_id: "mydb" });
  });

  it("matches a nested path with trailing slash", () => {
    const result = match(fakeReq("GET", "/dbs/mydb/colls/mycoll/"));
    expect(result).toBeDefined();
    expect(result![0]).toEqual({ db_id: "mydb", coll_id: "mycoll" });
  });

  it("does not strip the root slash", () => {
    const rootMatch = router({ GET: { "/": handler } });
    const result = rootMatch(fakeReq("GET", "/"));
    expect(result).toBeDefined();
  });

  it("matches a double-slash path", () => {
    const result = match(fakeReq("GET", "//dbs/mydb"));
    expect(result).toBeDefined();
    expect(result![0]).toEqual({ db_id: "mydb" });
  });
});
