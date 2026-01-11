import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Botao } from '../../components/Botao';
import { ServicoComandas } from '../../services/ServicoComandas';
import { definirComandaSessao, definirSessao } from '../../utils/sessao';
import styles from './EntrarComanda.module.css';

export function EntrarComanda() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [codigo, setCodigo] = useState('');
    const [apelido, setApelido] = useState('');
    const [idDispositivo, setIdDispositivo] = useState('');
    const [statusSolicitacao, setStatusSolicitacao] = useState<'inicial' | 'pendente' | 'aprovado' | 'recusado' | 'revogado'>('inicial');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    const restauranteId = searchParams.get('restauranteId') ?? '';
    const codigoInicial = searchParams.get('codigo') ?? '';

    useEffect(() => {
        if (restauranteId !== '') {
            definirSessao(restauranteId, 'cliente');
        }
    }, [restauranteId]);

    useEffect(() => {
        if (codigoInicial !== '') {
            setCodigo(codigoInicial);
        }
    }, [codigoInicial]);

    useEffect(() => {
        if (idDispositivo === '' || codigo.trim() === '') return;

        let ativo = true;
        const consultar = async () => {
            try {
                const resp = await ServicoComandas.consultarSolicitacao(idDispositivo, codigo.trim());
                if (!ativo) return;
                const status = resp.status as 'pendente' | 'aprovado' | 'recusado' | 'revogado';
                setStatusSolicitacao(status);

                if (status === 'aprovado' && resp.token && resp.comandaId) {
                    definirComandaSessao(resp.comandaId, resp.token, codigo.trim());
                    const resumo = await ServicoComandas.obterResumo(resp.comandaId);
                    const numeroMesa = resumo.mesaAtual?.numero ?? 0;
                    const sufixo = restauranteId !== '' ? `?restauranteId=${encodeURIComponent(restauranteId)}` : '';
                    void navigate(`/mesa/${String(numeroMesa)}${sufixo}`);
                } else if (status === 'aprovado' && !resp.token) {
                    setErro('Acesso já aprovado. Solicite uma nova entrada.');
                    setIdDispositivo('');
                }
            } catch (e) {
                if (!ativo) return;
                setErro('Não foi possível consultar a solicitação.');
            }
        };

        const intervalo = window.setInterval(consultar, 3000);
        void consultar();

        return () => {
            ativo = false;
            window.clearInterval(intervalo);
        };
    }, [codigo, idDispositivo, navigate, restauranteId]);

    const solicitarAcesso = async () => {
        if (codigo.trim() === '') return;
        setErro('');
        setCarregando(true);
        try {
            const resp = await ServicoComandas.solicitarAcesso(codigo.trim(), apelido.trim() || undefined);
            setIdDispositivo(resp.idDispositivo);
            setStatusSolicitacao('pendente');
        } catch (e) {
            setErro('Não foi possível solicitar acesso à comanda.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <header className={styles.cabecalho}>
                    <p className={styles.rotulo}>Comanda</p>
                    <h1 className={styles.titulo}>Entrar na comanda</h1>
                    <p className={styles.subtitulo}>Peça aprovação do master para entrar.</p>
                </header>

                <label className={styles.label} htmlFor="codigo-comanda">
                    Código da comanda
                </label>
                <input
                    id="codigo-comanda"
                    className={styles.input}
                    value={codigo}
                    onChange={(event) => { setCodigo(event.target.value.toUpperCase()); }}
                    placeholder="Ex: A1B2C3"
                    disabled={statusSolicitacao === 'pendente'}
                />

                <label className={styles.label} htmlFor="apelido-dispositivo">
                    Apelido (opcional)
                </label>
                <input
                    id="apelido-dispositivo"
                    className={styles.input}
                    value={apelido}
                    onChange={(event) => { setApelido(event.target.value); }}
                    placeholder="Ex: Celular da Ana"
                    disabled={statusSolicitacao === 'pendente'}
                />

                {erro && <p className={styles.erro}>{erro}</p>}

                {statusSolicitacao === 'pendente' && (
                    <p className={styles.status}>Aguardando aprovação do master...</p>
                )}
                {statusSolicitacao === 'recusado' && (
                    <p className={styles.status}>Solicitação recusada.</p>
                )}
                {statusSolicitacao === 'revogado' && (
                    <p className={styles.status}>Acesso revogado pelo master.</p>
                )}

                <Botao
                    variante="primario"
                    tamanho="grande"
                    onClick={() => { void solicitarAcesso(); }}
                    disabled={carregando || statusSolicitacao === 'pendente'}
                >
                    {carregando ? 'Enviando...' : 'Solicitar acesso'}
                </Botao>
            </div>
        </div>
    );
}
