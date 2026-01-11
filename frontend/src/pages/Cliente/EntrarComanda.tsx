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
    const idMesaInicial = searchParams.get('idMesa') ?? '';

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
        if (idDispositivo === '' || (codigo.trim() === '' && idMesaInicial === '')) return;

        let ativo = true;
        const consultar = async () => {
            try {
                // Se não temos o código ainda, mas temos o dispositivo id e código inicial, usamos ele
                const codFinal = codigo.trim() || codigoInicial.trim();
                
                // Se ainda não temos o código (estamos usando idMesa)
                // O backend agora retorna o códigoComanda no solicitarAcessoMesa
                if (codFinal === '') return;

                const resp = await ServicoComandas.consultarSolicitacao(idDispositivo, codFinal);
                if (!ativo) return;
                const status = resp.status as 'pendente' | 'aprovado' | 'recusado' | 'revogado';
                setStatusSolicitacao(status);

                if (status === 'aprovado' && resp.token && resp.comandaId) {
                    definirComandaSessao(resp.comandaId, resp.token, codFinal);
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
    }, [codigo, codigoInicial, idDispositivo, idMesaInicial, navigate, restauranteId]);

    const solicitarAcesso = async () => {
        if (codigo.trim() === '' && idMesaInicial === '') return;
        setErro('');
        setCarregando(true);
        try {
            if (idMesaInicial !== '' && codigo.trim() === '') {
                const resp = await ServicoComandas.solicitarAcessoMesa(idMesaInicial, apelido.trim() || undefined);
                setIdDispositivo(resp.idDispositivo);
                setCodigo(resp.codigoComanda); // Armazena o código recebido para o polling
                setStatusSolicitacao('pendente');
            } else {
                const resp = await ServicoComandas.solicitarAcesso(codigo.trim(), apelido.trim() || undefined);
                setIdDispositivo(resp.idDispositivo);
                setStatusSolicitacao('pendente');
            }
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
                    <p className={styles.subtitulo}>
                        {idMesaInicial !== '' 
                            ? `A Mesa ${idMesaInicial} já possui uma comanda aberta. Peça aprovação para entrar.`
                            : 'Peça aprovação do master para entrar.'}
                    </p>
                </header>

                {idMesaInicial === '' || codigo !== '' ? (
                    <>
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
                    </>
                ) : null}

                <label className={styles.label} htmlFor="apelido-dispositivo">
                    Seu nome / Apelido (opcional)
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
