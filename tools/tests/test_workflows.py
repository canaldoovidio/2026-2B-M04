"""A publicação no Pages só acontece depois de a validação passar."""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _ler(nome):
    with open(os.path.join(RAIZ, ".github", "workflows", nome), encoding="utf-8") as fh:
        return fh.read()


def test_pages_espera_a_validacao_passar():
    publicar = _ler("static.yml")
    validar = _ler("validate.yml")
    assert "name: Validar o acervo" in validar
    assert "workflow_run:" in publicar
    assert "workflows: [\"Validar o acervo\"]" in publicar
    assert "github.event.workflow_run.conclusion == 'success'" in publicar
    assert "push:" not in publicar.split("jobs:")[0]


def test_publicacao_usa_o_commit_validado():
    assert "ref: ${{ github.event.workflow_run.head_sha }}" in _ler("static.yml")


def test_instalacao_do_arduino_cli_cria_a_pasta_e_fixa_a_versao():
    """Regressão do CI de 13/10/2026: o install.sh recusa BINDIR inexistente."""
    validar = _ler("validate.yml")
    assert "mkdir -p $HOME/.local/bin" in validar
    assert validar.index("mkdir -p $HOME/.local/bin") < validar.index("install.sh")
    import re
    assert re.search(r"install\.sh \| BINDIR=\$HOME/\.local/bin sh -s \d+\.\d+\.\d+", validar)
