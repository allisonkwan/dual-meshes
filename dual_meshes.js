let tetra, octa, icosa, star, torus;

let animate_flag = 1;
let normal_flag = 0;
let random_flag = 0;

let vertices = [];
let corners = [];
let faces = [];
let randomColorList = [];

class Face {
  constructor(fid, x, y, z, n, cen) {
    this.fid = fid;
    this.cid1 = x;
    this.cid2 = y;
    this.cid3 = z;
    this.n = n;
    this.cen = cen;
  }
}

class Vector {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

class Vertex {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.n = new Vector(0, 0, 0);
  }
}

class Corner {
  constructor(cid, vid, fid, nid, pid) {
    this.cid = cid;
    this.vid = vid;
    this.fid = fid;
    this.nid = nid;
    this.pid = pid;
    this.oid = null;
  }
}

function centroid(v1, v2, v3) {
  let x = (v1.x + v2.x + v3.x) / 3;
  let y = (v1.y + v2.y + v3.y) / 3;
  let z = (v1.z + v2.z + v3.z) / 3;
  return new Vector(x, y, z);
}

function dotMul(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function vSum(v1, v2) {
  return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
}

function vDiff(v1, v2) {
  return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
}

function vCross(u, v) {
  return new Vector(u.y * v.z - u.z * v.y, u.z * v.x - u.x * v.z, u.x * v.y - u.y * v.x)
}

function normalize(v) {
  let length = sqrt(dotMul(v, v));
  return new Vector(v.x / length, v.y / length, v.z / length);
}

function hasV(cid1, cid2, cid3, vid) {
  let c1 = corners[cid1];
  let c2 = corners[cid2];
  let c3 = corners[cid3];
  if (c1.vid == vid) {
    return c1.cid;
  }
  if (c2.vid == vid) {
    return c2.cid;
  }
  if (c3.vid == vid) {
    return c3.cid;
  }
  return -1;
}

let time = 0;  // records the passage of time, used to move the objects

// read in the polygon mesh files
function preload() {
  tetra = loadStrings('assets/tetra.txt');
  octa = loadStrings('assets/octa.txt');
  icosa = loadStrings('assets/icosa.txt');
  star = loadStrings('assets/star.txt');
  torus = loadStrings('assets/torus.txt');
}

// called once at the start of the program
function setup() {
  createCanvas(600, 600, WEBGL);

  let fov = 60.0;  // 60 degrees field of view
  perspective(PI * fov / 180.0, width / height, 0.1, 2000);
}

// handle key press commands
function keyPressed() {
  //console.log ("key pressed\n");
  switch (key) {
    case ' ': animate_flag = 1 - animate_flag; break;
    case '1': parse_polys(tetra); break;
    case '2': parse_polys(octa); break;
    case '3': parse_polys(icosa); break;
    case '4': parse_polys(star); break;
    case '5': parse_polys(torus); break;
    case 'd': create_dual(); break;
    case 'n': normal_flag = 1 - normal_flag; break;
    case 'r': random_flag = 1 - random_flag; break;
    case 'q': debugger; break;
  }
  for (let i = 0; i < faces.length; i++) {
    randomColorList.push([random() * 255, random() * 255, random() * 255]);
  }
}

// called repeatedly to create new per-frame images
function draw() {
  background(0);  // black background

  // set the virtual camera position
  camera(0, 0, 5, 0, 0, 0, 0, 1, 0);  // from, at, up

  // include a little bit of light even in shadows
  ambientLight(100, 100, 100);

  // set the light position
  pointLight(255, 255, 255, 100, -100, 300);
  pointLight(255, 255, 255, -100, 100, -300);

  noStroke();  // don't draw polygon outlines

  fill(255, 255, 255);

  push();

  let mesh_axis = createVector(0, 1, 0);
  rotate(-time, mesh_axis);

  // this is where you should draw your collection of polygons
  for (let i = 0; i < faces.length; i++) {
    if (random_flag == 1) {
      let rcolor = randomColorList[i];
      fill(rcolor[0], rcolor[1], rcolor[2]);
    } else {
      fill(200, 200, 200);
    }

    vid1 = corners[3 * i].vid;
    vid2 = corners[3 * i + 1].vid;
    vid3 = corners[3 * i + 2].vid;

    if (normal_flag == 1) {
      let n = faces[i].n;
      beginShape();
      vertexNormal(n.x, n.y, n.z);
      vertex(vertices[vid1].x, vertices[vid1].y, vertices[vid1].z);
      vertex(vertices[vid2].x, vertices[vid2].y, vertices[vid2].z);
      vertex(vertices[vid3].x, vertices[vid3].y, vertices[vid3].z);
      endShape(CLOSE);
    } else {
      beginShape();
      let n = vertices[vid1].n;
      vertexNormal(n.x, n.y, n.z);
      vertex(vertices[vid1].x, vertices[vid1].y, vertices[vid1].z);

      n = vertices[vid2].n;
      vertexNormal(n.x, n.y, n.z);
      vertex(vertices[vid2].x, vertices[vid2].y, vertices[vid2].z);

      n = vertices[vid3].n;
      vertexNormal(n.x, n.y, n.z);
      vertex(vertices[vid3].x, vertices[vid3].y, vertices[vid3].z);
      endShape(CLOSE);
    }
  }

  pop();

  // maybe update time
  if (animate_flag)
    time += 0.02;
}

// Parse a polygon mesh file.
function parse_polys(s) {

  //console.log ("in read_polys()");

  let vertex_count, face_count;
  let tokens = [];
  vertices = [];
  corners = [];
  faces = [];

  // go through all the lines in the file and separate the tokens
  for (let i = 0; i < s.length; i++) {
    tokens[i] = s[i].split(" ");
  }

  vertex_count = parseInt(tokens[0][1]);
  face_count = parseInt(tokens[1][1]);

  // read in the vertex coordinates
  for (let i = 0; i < vertex_count; i++) {
    let tlist = tokens[i + 2];
    let x = parseFloat(tlist[0]);
    let y = parseFloat(tlist[1]);
    let z = parseFloat(tlist[2]);

    vertices.push(new Vertex(x, y, z));
  }

  // read in the face indices
  for (let i = 0; i < face_count; i++) {
    let tlist = tokens[i + vertex_count + 2];
    let nverts = parseInt(tlist[0]);
    let v1 = parseInt(tlist[1]);
    let v2 = parseInt(tlist[2]);
    let v3 = parseInt(tlist[3]);

    corners.push(new Corner(3 * i, v1, i, 3 * i + 1, 3 * i + 2));
    corners.push(new Corner(3 * i + 1, v2, i, 3 * i + 2, 3 * i));
    corners.push(new Corner(3 * i + 2, v3, i, 3 * i, 3 * i + 1));

    let u = vDiff(vertices[v2], vertices[v1]);
    let v = vDiff(vertices[v3], vertices[v1]);
    let n = normalize(vCross(u, v));

    let cent = centroid(vertices[v1], vertices[v2], vertices[v3]);
    faces.push(new Face(i, 3 * i, 3 * i + 1, 3 * i + 2, n, cent));
  }
  findOpposites();
}

// produces the triangulated dual of the current mesh
function create_dual() {
  let newv = [];
  let newc = [];
  let newf = [];
  for (let f = 0; f < faces.length; f++) {
    let cent = faces[f].cen;
    newv.push(new Vertex(cent.x, cent.y, cent.z));
  }
  for (let v = 0; v < vertices.length; v++) {
    let fids = swing(v);
    let cens = [];
    for (let i = 0; i < fids.length; i++) {
      cens.push(newv[fids[i]]);
    }
    let sumx = 0;
    let sumy = 0;
    let sumz = 0;
    for (let c = 0; c < cens.length; c++) {
      sumx += cens[c].x;
      sumy += cens[c].y;
      sumz += cens[c].z;
    }
    let avg = new Vertex(sumx / cens.length, sumy / cens.length, sumz / cens.length);
    newv.push(avg);
    let index1 = newv.length - 1;
    let newlength = fids.length;
    let lf = newf.length;
    for (let j = 0; j < newlength; j++) {
      let i = j + lf;
      let index2 = fids[j];
      let index3 = fids[(j + 1) % newlength];
      newc.push(new Corner(3 * i, index1, i, 3 * i + 1, 3 * i + 2));
      newc.push(new Corner(3 * i + 1, index2, i, 3 * i + 2, 3 * i));
      newc.push(new Corner(3 * i + 2, index3, i, 3 * i, 3 * i + 1));
      let u = vDiff(newv[index2], newv[index1]);
      let v = vDiff(newv[index3], newv[index1]);
      let n = normalize(vCross(u, v));
      let cent = centroid(newv[index1], newv[index2], newv[index3]);
      newf.push(new Face(i, 3 * i, 3 * i + 1, 3 * i + 2, n, cent));
    }
  }
  corners = newc;
  vertices = newv;
  faces = newf;

  findOpposites();
}

function swing(vid) {
  let fids = [];
  let cid = -1;
  for (let x = 0; x < faces.length; x++) {
    let cid1 = faces[x].cid1;
    let cid2 = faces[x].cid2;
    let cid3 = faces[x].cid3;
    cid = hasV(cid1, cid2, cid3, vid);
    if (cid != -1) {
      fids.push(x);
      break;
    }
  }
  let opp = corners[corners[corners[cid].nid].oid];
  let next_fid = opp.fid;
  while (next_fid != fids[0]) {
    fids.push(next_fid);
    cid = opp.nid;
    opp = corners[corners[corners[cid].nid].oid];
    next_fid = opp.fid;
  }
  return fids;
}

function findOpposites() {
  for (let a = 0; a < corners.length; a++) {
    for (let b = 0; b < corners.length; b++) {
      let an = corners[corners[a].nid];
      let ap = corners[corners[a].pid];
      let bn = corners[corners[b].nid];
      let bp = corners[corners[b].pid];
      if (an.vid == bp.vid && ap.vid == bn.vid) {
        corners[a].oid = corners[b].cid;
        corners[b].oid = corners[a].cid;
      }
    }
  }
  for (let i = 0; i < vertices.length; i++) {
    for (let c = 0; c < corners.length; c++) {
      if (corners[c].vid == i) {
        let vn = vertices[corners[corners[c].nid].vid];
        let vp = vertices[corners[corners[c].pid].vid];
        let u = vCross(vn, vp);
        vertices[i].n = vSum(vertices[i].n, u);
      }
    }
    vertices[i].n = normalize(vertices[i].n);
  }
}