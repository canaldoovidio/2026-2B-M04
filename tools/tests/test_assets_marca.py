import os
import xml.etree.ElementTree as ET

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMG = os.path.join(RAIZ, "assets", "img")
SVG_NS = "{http://www.w3.org/2000/svg}"

PALETA = {"#2e2640", "#ff4545", "#89cea5", "#b2b6bf", "#caced6", "#e6eaeb", "#ffffff"}
ESPERADOS = [
    "inteli-logo-positiva.svg",
    "inteli-logo-negativa.svg",
    "inteli-logo-mono.svg",
    "inteli-grafismo-graduacao.svg",
]


def test_todos_os_assets_existem():
    for nome in ESPERADOS:
        assert os.path.isfile(os.path.join(IMG, nome)), nome


def test_todo_svg_tem_viewbox_e_escala():
    for nome in ESPERADOS:
        raiz = ET.parse(os.path.join(IMG, nome)).getroot()
        assert raiz.get("viewBox"), "%s sem viewBox" % nome
        assert raiz.get("width") is None, "%s com largura fixa" % nome
        assert raiz.get("height") is None, "%s com altura fixa" % nome


def test_todo_fill_esta_na_paleta():
    for nome in ESPERADOS:
        raiz = ET.parse(os.path.join(IMG, nome)).getroot()
        for el in raiz.iter():
            fill = (el.get("fill") or "").strip().lower()
            if not fill or fill in ("none", "currentcolor"):
                continue
            assert fill in PALETA, "%s: fill %s fora da paleta" % (nome, fill)


def test_logo_nao_usa_texto_com_fonte_externa():
    for nome in ESPERADOS[:3]:
        raiz = ET.parse(os.path.join(IMG, nome)).getroot()
        assert raiz.find(".//%stext" % SVG_NS) is None, \
            "%s tem <text>: a marca precisa estar em curvas" % nome


def test_grafismo_tem_exatamente_tres_faces():
    raiz = ET.parse(os.path.join(IMG, "inteli-grafismo-graduacao.svg")).getroot()
    faces = raiz.findall(".//%spolygon" % SVG_NS)
    assert len(faces) == 3, "o grafismo tem sempre tres modulos (p.77)"
    cores = {(f.get("fill") or "").lower() for f in faces}
    assert cores == {"#89cea5", "#2e2640", "#caced6"}, \
        "combinacao do segmento Graduacao (p.77): face inferior e cinza medio"
