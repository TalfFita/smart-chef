/**
 * seed.ts - Smart Chef
 * Datos iniciales del sistema: usuarios, 80 recetas con bloques
 * y 20 anotaciones de estilo sobre términos culinarios reales.
 *
 * Idempotente: deleteMany al inicio garantiza que ejecutarlo
 * varias veces no duplica datos.
 *
 * Combinaciones cubiertas: 4 categorías × 5 estilos × 2 modos = 40
 * 2 recetas por combinación = 80 recetas en total.
 */

import { PrismaClient, CategoriaMenu, EstiloCulinario, ModoPreparacion, Dificultad, TipoBloque } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// MAIN

async function main(): Promise<void> {
  console.log('Iniciando seed...');

  // TRUNCATE con RESTART IDENTITY resetea las secuencias SERIAL,
  // garantizando que los usuarios siempre reciben id 1 y 2 tras el seed.
  // CASCADE elimina filas dependientes en orden correcto automáticamente.
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "historial_cocina", "favoritos", "anotaciones_privadas",
     "anotaciones_estilo", "bloques_receta", "recetas", "usuarios"
     RESTART IDENTITY CASCADE`
  );

  console.log('Tablas limpiadas y secuencias reiniciadas');

  // USUARIOS

  const hashAdmin = await bcrypt.hash('Admin1234!', SALT_ROUNDS);
  const hashUser  = await bcrypt.hash('User1234!',  SALT_ROUNDS);

  await prisma.usuario.createMany({
    data: [
      { email: 'admin@smartchef.com',   password_hash: hashAdmin, nombre: 'Administrador' },
      { email: 'usuario@smartchef.com', password_hash: hashUser,  nombre: 'Usuario Demo'  },
    ],
  });

  console.log('Usuarios creados');

  // RECETAS
  // Cada receta se crea con sus bloques anidados via create (no createMany)
  // para poder usar nested writes de Prisma.

  // ENTRANTE × MEDITERRANEO × TRADICIONAL
  await crearReceta({
    titulo: 'Gazpacho andaluz',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.MEDITERRANEO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 20,
    ingredientes_texto: '1 kg de tomates maduros, 1 pepino, 1 pimiento verde, 1 diente de ajo, 50 ml de aceite de oliva virgen extra, 30 ml de vinagre de Jerez, sal al gusto, agua fría',
    tags: ['crudo', 'frío', 'sin_cocción', 'verano', 'sin_gluten', 'vegano'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Lava bien los tomates, el pepino y el pimiento. Trocea los tomates en cuartos, el pepino pelado en rodajas gruesas y el pimiento sin semillas en trozos. Pela el diente de ajo.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Introduce todas las verduras troceadas en el vaso de la batidora. Añade el aceite de oliva, el vinagre de Jerez y una pizca de sal. Tritura a máxima potencia durante dos minutos hasta obtener una crema homogénea.', tiempo_estimado: 5 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Pasa la mezcla por un colador fino o chino, presionando con una cuchara para extraer todo el líquido. Descarta los sólidos. Ajusta el punto de sal y vinagre. Si la textura es demasiado espesa, añade agua fría hasta conseguir la consistencia deseada.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Refrigera al menos 30 minutos antes de servir. Presenta bien frío en cuencos o vasos, con un hilo de aceite de oliva por encima. Opcionalmente acompaña con picatostes y brunoise de pepino y pimiento.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × MEDITERRANEO × PROFESIONAL
  await crearReceta({
    titulo: 'Tartar de atún con aguacate y soja',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.MEDITERRANEO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 25,
    ingredientes_texto: '300 g de atún rojo de calidad sashimi, 1 aguacate maduro, 2 cucharadas de salsa de soja, 1 cucharadita de aceite de sésamo, 1 lima, cebollino fresco, sal en escamas, sésamo tostado',
    tags: ['crudo', 'marinado', 'emplatado', 'sin_cocción', 'proteína'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'El atún para consumo en crudo requiere congelación previa a -20 °C durante al menos 48 horas (uso obligatorio). Descongela en nevera 12 horas antes. Con un cuchillo bien afilado, corta el atún en dados de 1 cm de lado con movimientos limpios sin aplastar la carne.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Marina los dados de atún en un cuenco con la salsa de soja, el aceite de sésamo y el zumo de media lima. Mezcla con cuidado y deja reposar 5 minutos en nevera. El marinado debe perfumar sin "cocer" el pescado, por lo que no debe prolongarse más de 10 minutos.', tiempo_estimado: 8 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Prepara la base de aguacate: aplasta la pulpa con un tenedor, añade sal, zumo de lima y una gota de aceite de sésamo. Coloca en el fondo del molde circular o aro de emplatado. Dispón el tartar de atún escurrido sobre el aguacate, presionando ligeramente.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Retira el aro con cuidado. Termina con cebollino picado fino, sal en escamas y sésamo tostado. Pasa al plato frío sin demora.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × LATINO × TRADICIONAL
  await crearReceta({
    titulo: 'Ceviche peruano clásico',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.LATINO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 30,
    ingredientes_texto: '500 g de corvina o lenguado muy fresco, 150 ml de zumo de lima recién exprimido, 1 ají amarillo fresco, 1 cebolla morada, 1 diente de ajo, jengibre fresco, cilantro fresco, sal, maíz cancha tostado, choclo cocido',
    tags: ['crudo', 'marinado', 'ácido', 'fresco', 'sin_cocción', 'pescado'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Corta el pescado en dados de 2 cm. El pescado debe ser del día y de la mejor calidad posible: de ello depende todo el plato. Reserva en frío. Corta la cebolla morada en juliana fina y sumérgela en agua con sal durante 5 minutos para suavizar su sabor. Escurre bien.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Prepara la leche de tigre: licúa una pequeña parte del pescado (50 g) con el zumo de lima, el ají amarillo sin semillas, el ajo, un trozo de jengibre pelado y sal. Cuela y reserva. Este líquido es la base ácida del ceviche y le da su característico picor suave.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'En un cuenco frío mezcla el pescado con la cebolla escurrida. Vierte la leche de tigre y mezcla con las manos limpias. El tiempo de marinado debe ser corto: 3 minutos es suficiente. El objetivo es que el ácido comience a desnaturalizar el exterior del pescado sin cocinarlo por completo.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Emplata en plato frío. Acompaña con maíz cancha tostado, rodajas de choclo cocido y hojas de cilantro fresco. El ceviche no espera: debe comerse al momento.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × LATINO × PROFESIONAL
  await crearReceta({
    titulo: 'Tostadas de maíz con guacamole técnico y reducción de jalapeño',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.LATINO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 50,
    ingredientes_texto: '200 g de masa de maíz nixtamalizado (masa harina), 2 aguacates Hass maduros, 2 jalapeños frescos, 3 cucharadas de miel de agave, 1 lima, cilantro, cebolla blanca, sal en escamas, aceite de girasol para freír',
    tags: ['fritura', 'reducción', 'emplatado', 'maíz', 'picante', 'lacado'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Hidrata la masa harina con agua tibia y sal hasta obtener una masa maleable que no se pegue. Forma bolas de 30 g y aplana en tortillera o entre dos plásticos hasta 2 mm de grosor. Corta en círculos de 8 cm.', tiempo_estimado: 15 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Fríe las tostadas en aceite a 175 °C hasta que estén doradas y crujientes (unos 3 minutos por lado). Escurre sobre papel absorbente y sala ligeramente. Mantén en horno a 80 °C para conservar el crujiente.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Para la reducción: corta los jalapeños en rodajas finas (con semillas para más picante, sin ellas para suavizar). En un cazo pequeño, combina jalapeño, miel de agave y 50 ml de agua. Reduce a fuego medio-bajo durante 12 minutos hasta obtener un jarabe que napa la cuchara.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Guacamole al momento: aplasta el aguacate con tenedor preservando algo de textura. Incorpora cebolla blanca picada muy fina, cilantro, zumo de lima y sal. No proceses en exceso: debe tener cuerpo.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Monta las tostadas con una quenelle de guacamole. Termina con la reducción de jalapeño en hilo fino usando biberón de cocina, sal en escamas y una hoja de cilantro. El crujiente de la tostada dura poco: lleva a la mesa nada más montar.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × ASIATICO × TRADICIONAL
  await crearReceta({
    titulo: 'Gyozas de cerdo y col china al vapor',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.ASIATICO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 45,
    ingredientes_texto: '20 obleas de gyoza, 300 g de carne de cerdo picada, 150 g de col china, 2 cebolletas, 2 dientes de ajo, 1 trozo de jengibre fresco, 2 cucharadas de salsa de soja, 1 cucharadita de aceite de sésamo, aceite vegetal',
    tags: ['vapor', 'plancha', 'vapor_plancha', 'japonés', 'cerdo', 'dumpling'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Pica la col china muy fina, sala ligeramente y deja reposar 10 minutos. Exprímela con las manos para eliminar el exceso de agua. Pica las cebolletas, el ajo y el jengibre muy fino. Mezcla todo con la carne picada, la soja y el aceite de sésamo hasta obtener una farsa homogénea.', tiempo_estimado: 20 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Coloca una oblea en la palma de la mano. Pon una cucharadita de relleno en el centro. Humedece el borde con agua y cierra formando pliegues desde el centro hacia los extremos: este plisado es la firma de la gyoza. Comprueba que cada gyoza está bien sellada y sin bolsas de aire: el aire hace que revienten al cocinar.', tiempo_estimado: 15 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Calienta una sartén con tapa a fuego medio-alto con una cucharada de aceite. Coloca las gyozas con la base plana hacia abajo. Cuando estén doradas (2 minutos), añade 80 ml de agua y tapa de inmediato. El vapor terminará la cocción del relleno durante 5 minutos.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Destapa y deja evaporar el agua restante hasta que la base vuelva a crujir. Sirve con la base dorada hacia arriba. Acompaña con salsa ponzu (soja + zumo de cítrico) para mojar.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × ASIATICO × PROFESIONAL
  await crearReceta({
    titulo: 'Dim sum de gambas con aceite de chile y jengibre encurtido',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.ASIATICO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 90,
    ingredientes_texto: '200 g de almidón de trigo (wheat starch), 50 g de fécula de patata, agua hirviendo, 400 g de gambas crudas peladas, 1 trozo de bambú en conserva, sal, aceite de sésamo, 3 chiles secos, aceite neutro, 100 g de jengibre fresco, vinagre de arroz, azúcar',
    tags: ['vapor', 'encurtido', 'infusión', 'emplatado', 'marisco', 'har_gow'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Encurtido rápido de jengibre: pela y corta en láminas finas. Escalda 30 segundos en agua hirviendo, escurre y marina en vinagre de arroz con azúcar y sal durante 30 minutos mínimo. Reserva. Para el aceite de chile: calienta aceite neutro a 160 °C y vierte sobre los chiles secos troceados. Infusiona 20 minutos.', tiempo_estimado: 35 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Masa har gow: mezcla el almidón de trigo con la fécula. Vierte agua hirviendo (90 °C mínimo) y mezcla rápidamente con palillos. Cuando entibie, amasa con las manos hasta obtener masa lisa y traslúcida. Trabaja rápido: si se enfría demasiado se agrieta. Cubre con film.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Relleno: pica la mitad de las gambas muy finas y deja la otra mitad en trozos para dar textura. Mezcla con bambú picado, sal y aceite de sésamo. Estira la masa muy fina (1 mm), corta círculos de 8 cm y rellena con 15 g de farsa. Sella con pliegues tradicionales de har gow.', tiempo_estimado: 25 },
      { tipo: TipoBloque.COCINAR, orden: 4, contenido: 'Coloca los har gow sobre papel de cocina en la vaporera de bambú engrasada. Cuece al vapor a fuego vivo durante 7 minutos. La cocción correcta se ve a simple vista: masa translúcida y gambas del todo rosadas.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Presenta en la propia cesta de bambú. Termina con el aceite de chile en gota y dos láminas de jengibre encurtido por pieza. Se comen en el acto: la masa se endurece en minutos.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × NORDICO × TRADICIONAL
  await crearReceta({
    titulo: 'Salmón gravlax con mostaza y eneldo',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.NORDICO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 30,
    ingredientes_texto: '600 g de lomo de salmón fresco con piel, 4 cucharadas de sal gruesa, 3 cucharadas de azúcar, 1 manojo de eneldo fresco, 1 cucharadita de pimienta blanca molida, 2 cucharadas de mostaza de Dijon, 1 cucharada de mostaza antigua, 1 cucharada de miel, 2 cucharadas de aceite vegetal',
    tags: ['curado', 'crudo', 'sin_cocción', 'marinado', 'escandinavo', 'salmón'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'El salmón para gravlax debe haber pasado por congelación previa (necesario para eliminar parásitos). Deshuesa con pinzas. Mezcla la sal, el azúcar y la pimienta blanca. Pica el eneldo grueso.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Cubre la base de una fuente con la mitad de la mezcla de sal y la mitad del eneldo. Coloca el salmón con la piel hacia abajo. Cubre con el resto de la mezcla y el eneldo restante. Presiona con otro recipiente con peso encima.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ESPERAR, orden: 3, contenido: 'Refrigera 48 horas. Da la vuelta al salmón cada 12 horas y elimina el líquido que suelta. El curado transforma la textura: la carne se vuelve firme y brillante.', tiempo_estimado: 2880 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Prepara la salsa: mezcla las dos mostazas con la miel y el aceite hasta emulsionar. Añade eneldo picado fino.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Retira la costra de sal y seca con papel. Corta en lonchas muy finas en diagonal. Sirve sobre pan de centeno tostado con la salsa de mostaza y eneldo.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × NORDICO × PROFESIONAL
  await crearReceta({
    titulo: 'Crudo de vieira con espuma de mantequilla nórdica y huevas de trucha',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.NORDICO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 40,
    ingredientes_texto: '6 vieiras muy frescas, 150 g de mantequilla sin sal, 200 ml de nata líquida, 1 lámina de alga nori, huevas de trucha, cebollino, sal en escamas, limón',
    tags: ['crudo', 'sifón', 'espuma', 'emplatado', 'marisco', 'algas', 'minimalista'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Abre las vieiras y separa el músculo del coral. Limpia los músculos retirando la membrana lateral. Refrigera sobre hielo hasta el momento de servir. Tuesta el alga nori en sartén seca 30 segundos por lado y tritura hasta obtener polvo fino.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Base de espuma: funde la mantequilla a fuego bajo, añade la nata y el polvo de alga nori. Infusiona 5 minutos sin hervir. Cuela, sala y carga en sifón ISI con dos cargas de N₂O. Agita y reserva en baño maría a 60 °C para que la espuma salga caliente al servir.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Corta cada músculo de vieira en láminas finas de 3 mm con cuchillo muy afilado. Alíñalas ligeramente con sal en escamas y unas gotas de limón justo antes de emplatar.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'En plato frío y hondo, coloca las láminas de vieira en abanico. Descarga la espuma caliente de mantequilla con algas en el centro. Termina con huevas de trucha, cebollino picado y sal en escamas. La contraposición frío-caliente es parte del plato.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × FUSION × TRADICIONAL
  await crearReceta({
    titulo: 'Bruschetta con hummus de remolacha y zaatar',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.FUSION,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 35,
    ingredientes_texto: '4 rebanadas de pan de masa madre, 2 remolachas medianas, 1 bote de garbanzos cocidos (400 g), 3 cucharadas de tahini, 1 limón, 1 diente de ajo, zaatar, aceite de oliva, sal',
    tags: ['horno', 'tostado', 'legumbre', 'vegano', 'levantino', 'colorido'],
    bloques: [
      { tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Envuelve las remolachas en papel de aluminio con un poco de aceite y sal. Asa en horno a 200 °C durante 45 minutos hasta que estén tiernas al pincharlas. Deja enfriar y pela frotando con papel de cocina (mancha mucho, usa guantes).', tiempo_estimado: 50 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Tritura los garbanzos escurridos con la remolacha asada, el tahini, el zumo de limón, el ajo y sal hasta obtener un hummus liso y de color fucsia intenso. Ajusta la textura con agua fría si es necesario.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Tuesta las rebanadas de pan en plancha o tostadora hasta que estén doradas y crujientes por fuera pero tiernas por dentro.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Unta generosamente el hummus de remolacha sobre cada rebanada. Espolvorea zaatar, añade un hilo de aceite de oliva y lleva a la mesa.', tiempo_estimado: null },
    ],
  });

  // ENTRANTE × FUSION × PROFESIONAL
  await crearReceta({
    titulo: 'Tataki de buey con vinagreta de miso y trufa',
    categoria_menu: CategoriaMenu.ENTRANTE,
    estilo_culinario: EstiloCulinario.FUSION,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 30,
    ingredientes_texto: '400 g de solomillo de buey en pieza, 4 cucharadas de sésamo negro, 2 cucharadas de miso blanco (shiro miso), 1 cucharada de aceite de trufa, 1 cucharada de vinagre de arroz, 2 cucharadas de aceite de oliva, rúcula baby, sal en escamas',
    tags: ['plancha', 'sellado', 'crudo', 'emplatado', 'japonés_mediterráneo', 'trufa'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Saca el solomillo de la nevera 30 minutos antes. Seca con papel absorbente. Cubre toda la superficie exterior con sésamo negro presionando para que adhiera bien. Sala generosamente solo en el momento de cocinar, nunca antes (la sal extrae los jugos).', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Calienta una sartén de hierro fundido a fuego máximo hasta que humee. Sin añadir grasa, marca el solomillo 45 segundos exactos por cada una de sus cuatro caras. El interior permanece completamente crudo: ese es el tataki. Retira y deja reposar 5 minutos.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Vinagreta de miso y trufa: disuelve el miso en el vinagre de arroz. Emulsiona gradualmente con el aceite de oliva y el aceite de trufa usando varillas. La salsa ha de estar ligada y con aroma intenso a trufa.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Corta el tataki en lonchas de 5 mm. Dispón en abanico sobre el plato. Riega con la vinagreta de miso y trufa. Termina con rúcula baby y sal en escamas. El contraste entre la costra de sésamo y el interior rojo es el punto visual del plato.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × MEDITERRANEO × TRADICIONAL
  await crearReceta({
    titulo: 'Paella valenciana',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.MEDITERRANEO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 60,
    ingredientes_texto: '400 g de arroz bomba, 1/2 pollo troceado, 1/4 de conejo troceado, 200 g de judías verdes planas, 200 g de garrofón (alubia blanca grande), 1 tomate maduro rallado, 1 cucharadita de pimentón dulce, hebras de azafrán, 1,2 L de caldo de carne, aceite de oliva, sal, romero fresco',
    tags: ['fuego_abierto', 'paella', 'arroz', 'socarrat', 'valenciano'],
    bloques: [
      { tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Calienta aceite en la paellera a fuego medio-alto. Dora el pollo y el conejo salpimentados por todos los lados hasta que estén bien tostados (10 minutos). Retira y reserva. En el mismo aceite, sofríe las judías verdes hasta que cambien de color.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Añade el tomate rallado al sofrito y cocina hasta que evapore toda el agua y el tomate esté concentrado y oscuro. Incorpora el pimentón, remueve dos segundos sin que se queme, y añade el caldo caliente. Disuelve el azafrán en el caldo.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Reincorpora las carnes y el garrofón. Cuando el caldo hierva, distribuye el arroz en lluvia de forma uniforme. Ajusta el fuego para mantener una ebullición moderada. No remuevas el arroz en ningún momento a partir de este punto.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 4, contenido: 'Tras 10 minutos a fuego medio, reduce a fuego bajo durante 8 minutos. En los últimos 2 minutos, sube el fuego al máximo para conseguir el socarrat: la capa crujiente de arroz tostado en la base. Sabrás que está cuando huela a tostado sin quemado.', tiempo_estimado: 20 },
      { tipo: TipoBloque.ESPERAR, orden: 5, contenido: 'Retira del fuego y cubre con papel de periódico durante 5 minutos para que el arroz asiente y termine de absorber la humedad residual.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 6, contenido: 'Sirve directamente de la paellera. La paella no se remueve al servir. Acompaña con limón para quien quiera añadir unas gotas.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × MEDITERRANEO × PROFESIONAL
  await crearReceta({
    titulo: 'Lubina a la sal con aceite de hierbas y patata confitada',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.MEDITERRANEO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 80,
    ingredientes_texto: '1 lubina entera de 1,2 kg, 2 kg de sal gruesa marina, 2 claras de huevo, 300 g de patatas pequeñas, aceite de oliva virgen extra, romero, tomillo, laurel, estragón, ajo, pimienta blanca',
    tags: ['horno', 'sal', 'confitado', 'baja_temperatura', 'pescado', 'costra'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Infusiona el aceite de oliva con romero, tomillo, laurel y estragón a 60 °C durante 30 minutos. Cuela y reserva. Mezcla la sal gruesa con las claras de huevo ligeramente batidas hasta obtener una pasta húmeda que se compacte al apretarla.', tiempo_estimado: 35 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Confita las patatas sumergidas en el aceite de hierbas templado a 85 °C durante 25 minutos. Deben quedar tiernas pero enteras, con la piel intacta. Reserva en el propio aceite.', tiempo_estimado: 30 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Coloca una cama de sal en la bandeja. Dispón la lubina sin escamar (las escamas se van con la sal). Cubre completamente con el resto de la sal formando una costra hermética. Hornea a 220 °C durante 20 minutos por kilo de pescado.', tiempo_estimado: 25 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Rompe la costra en mesa, con golpe seco del canto de un cuchillo. Retira la sal con cuidado, tirando de la piel que saldrá adherida. Filetea el pescado con espátula fina eliminando la espina central.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Presenta el filete sobre plato caliente. Acompaña con las patatas confitadas escurridas y un hilo generoso del aceite de hierbas. Termina con pimienta blanca recién molida.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × LATINO × TRADICIONAL
  await crearReceta({
    titulo: 'Mole negro oaxaqueño con pechuga de pollo',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.LATINO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 120,
    ingredientes_texto: '4 pechugas de pollo, 3 chiles mulato secos, 3 chiles ancho secos, 2 chiles pasilla secos, 50 g de chocolate negro (70%), 1 tortilla de maíz, 2 dientes de ajo, 1/2 cebolla, 1 tomate, 1 cucharadita de comino, canela, pimienta negra, clavo, orégano seco, aceite, caldo de pollo, sal',
    tags: ['hervido', 'guiso', 'chile', 'mole', 'chocolate', 'mexicano', 'festivo'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Tuesta los chiles secos en comal o sartén sin aceite hasta que cambien de color y aromen (no quemes, amarga). Desvenados y sin semillas, remójalos en agua caliente 20 minutos hasta que se rehidraten.', tiempo_estimado: 25 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Asa en comal seco el ajo, la cebolla, el tomate y la tortilla hasta que estén ennegrecidos en los bordes (este tostado es parte del sabor del mole negro). Licúa junto con los chiles escurridos, el chocolate, el comino, la canela, el clavo y la pimienta con un poco del agua de remojo.', tiempo_estimado: 20 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Calienta aceite en una cazuela profunda a fuego alto. Vierte la pasta del mole con cuidado (salpica). Fríe durante 10 minutos removiendo constantemente hasta que la pasta se espese, oscurezca y el aceite comience a separarse. Sin esta fritura, el mole tendría sabor a chile crudo, no a mole.', tiempo_estimado: 15 },
      { tipo: TipoBloque.COCINAR, orden: 4, contenido: 'Añade el caldo de pollo caliente poco a poco, removiendo para integrar. Cocina a fuego lento durante 30 minutos hasta que el mole tenga consistencia de salsa que napa la cuchara. Incorpora las pechugas y cocina 15 minutos más.', tiempo_estimado: 50 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Sirve con arroz blanco mexicano y tortillas de maíz calientes. El mole mejora de un día para otro y se conserva bien en nevera varios días.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × LATINO × PROFESIONAL
  await crearReceta({
    titulo: 'Carne asada en sous vide con chimichurri técnico',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.LATINO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 90,
    ingredientes_texto: '600 g de entraña de res, 1 manojo de perejil, 1 manojo de orégano fresco, 4 dientes de ajo, 1 chile rojo, vinagre de vino tinto, aceite de oliva, sal en escamas, pimienta negra, pimentón ahumado',
    tags: ['sous_vide', 'parrilla', 'carbón', 'sellado', 'vacuno', 'chimichurri'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Sella la entraña al vacío con sal, pimienta y un poco de pimentón ahumado. Sin aceite: la grasa propia del corte es suficiente. Introduce en el baño de agua a 54 °C (punto medio) durante 60 minutos. A esa temperatura el colágeno no se desnaturaliza completamente, lo que da una textura característica de la entraña.', tiempo_estimado: 65 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Chimichurri emulsionado: tritura el perejil, el orégano, el ajo y el chile con el vinagre. Emulsiona añadiendo el aceite en hilo fino mientras bates. El resultado no es el chimichurri líquido tradicional sino una salsa verde untuosa. Sala y reserva.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Saca la entraña del vacío, seca muy bien con papel. Marca en parrilla de carbón a temperatura máxima, 90 segundos por cada lado. El objetivo es únicamente generar costra por reacción de Maillard sin alterar el punto interior conseguido en el sous vide.', tiempo_estimado: 5 },
      { tipo: TipoBloque.ESPERAR, orden: 4, contenido: 'Reposa 3 minutos sobre rejilla para que los jugos se redistribuyan. No cortes antes de este reposo.', tiempo_estimado: 3 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Corta en diagonal a contrafibra en lonchas de 1 cm. Sirve con el chimichurri emulsionado a un lado y sal en escamas por encima.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × ASIATICO × TRADICIONAL
  await crearReceta({
    titulo: 'Ramen de cerdo tonkotsu',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.ASIATICO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 240,
    ingredientes_texto: '1,5 kg de huesos de cerdo (rodilla y espinazo), 400 g de panceta de cerdo en pieza, 4 nidos de fideos ramen frescos, 4 huevos, 6 cucharadas de salsa de soja, 2 cucharadas de mirin, 2 cucharadas de sake, ajo, jengibre, cebolla, cebolleta, nori, bambú en conserva, aceite de sésamo',
    tags: ['hervido', 'largo', 'caldo', 'ramen', 'japonés', 'cerdo', 'fideos'],
    bloques: [
      { tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Blanquea los huesos en agua hirviendo 10 minutos. Escurre y lava bien cada hueso bajo el grifo para eliminar impurezas y sangre. Sin este blanqueado y lavado, el caldo resultará turbio y gris en lugar de blanco lechoso.', tiempo_estimado: 15 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Hierve los huesos limpios a fuego vivo durante 4 horas añadiendo agua cuando baje el nivel. La ebullición fuerte es intencional: emulsiona la grasa y el colágeno creando el caldo blanco lechoso del tonkotsu. Añade ajo y jengibre en la última hora.', tiempo_estimado: 240 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Chashu de panceta: ata la panceta con cuerda de cocina formando un cilindro. Dórala en sartén por todos los lados. Cuece en soja, mirin, sake y agua a fuego bajo durante 90 minutos. Deja enfriar en el líquido. Corta en rodajas de 1 cm.', tiempo_estimado: 100 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Huevos marinados (ajitsuke tamago): cuece los huevos exactamente 6 minutos y 30 segundos. Enfría en agua con hielo y pela. Marína en la salsa del chashu diluida 1:1 con agua durante mínimo 4 horas. La yema en su punto: cremosa, nunca seca.', tiempo_estimado: 20 },
      { tipo: TipoBloque.COCINAR, orden: 5, contenido: 'Cuece los fideos ramen según instrucciones (2-3 minutos). Cuela y distribuye en cuencos hondos calientes. Sirve el caldo tonkotsu colado y bien caliente sobre los fideos.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 6, contenido: 'Monta el bowl: fideos, caldo, dos rodajas de chashu, medio huevo marinado cortado, bambú escurrido, hoja de nori y cebolleta picada. Termina con unas gotas de aceite de sésamo.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × ASIATICO × PROFESIONAL
  await crearReceta({
    titulo: 'Pato Pekín lacado con crepes de arroz y salsa hoisin',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.ASIATICO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 120,
    ingredientes_texto: '1 pato entero de 2 kg, 4 cucharadas de maltosa o miel, 2 cucharadas de salsa de soja, 1 cucharada de vinagre de arroz, 5 especias chinas, 8 crepes de arroz, pepino en juliana, cebolleta en juliana, salsa hoisin',
    tags: ['horno', 'lacado', 'secado', 'pato', 'chino', 'especialidad'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Escalda el pato entero con agua hirviendo para cerrar los poros de la piel. Seca perfectamente con papel absorbente. Introduce una bomba de bicicleta bajo la piel del pecho y sopla para separar la piel de la carne: este es el secreto de la piel crujiente. Refrigera sin tapar 24 horas para secar la piel.', tiempo_estimado: 30 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Prepara el laqueado: disuelve la maltosa en agua caliente, añade soja, vinagre y cinco especias. Pinta el pato generosamente y refrigera sin tapar 2 horas más. Repite el laqueado. Antes de hornear, la piel tiene que estar casi seca y brillante al tacto.', tiempo_estimado: 20 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Hornea colgado (si tienes gancho) o sobre rejilla a 200 °C durante 60 minutos. A mitad de cocción, lacéalo de nuevo con el almíbar restante. El color objetivo es caoba profundo; al dar un golpe seco sobre la piel, tiene que sonar.', tiempo_estimado: 65 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Trincha el pato en mesa: primero retira la piel en láminas y reserva. Luego filetea la carne del pecho y muslos. En el servicio tradicional de Pekín, la piel se sirve primero, sola, seguida de la carne.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Sirve con crepes de arroz templados, juliana de pepino y cebolleta, y salsa hoisin. Cada comensal monta su propio crepe con piel crujiente, carne y verduras.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × NORDICO × TRADICIONAL
  await crearReceta({
    titulo: 'Estofado de bacalao nórdico con patata y nata',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.NORDICO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 40,
    ingredientes_texto: '600 g de bacalao fresco en lomos, 500 g de patatas harinosas, 1 cebolla grande, 200 ml de nata para cocinar, 50 g de mantequilla, eneldo fresco, sal, pimienta blanca, caldo de pescado o agua',
    tags: ['hervido', 'estofado', 'guiso', 'bacalao', 'nórdico', 'cremoso'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Pela y corta las patatas en rodajas de 1 cm. Pica la cebolla en juliana fina. Comprueba que el bacalao no tenga espinas pasando el dedo a contrapelo, retira las que encuentres con pinzas.', tiempo_estimado: 15 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Funde la mantequilla en una cazuela amplia a fuego medio. Pochea la cebolla hasta que esté transparente (8 minutos). Añade las patatas y cubre con el caldo de pescado. Cocina 12 minutos hasta que las patatas estén casi tiernas.', tiempo_estimado: 25 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Coloca los lomos de bacalao sobre las patatas. Vierte la nata por encima. Tapa y cocina a fuego suave 8 minutos hasta que el bacalao esté cocido pero aún jugoso. No remuevas para no romper el pescado.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Sirve en plato hondo con el caldo de nata, las patatas y el bacalao. Termina con abundante eneldo fresco picado y pimienta blanca.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × NORDICO × PROFESIONAL
  await crearReceta({
    titulo: 'Venado en costra de corteza de abedul con puré de apionabo',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.NORDICO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 90,
    ingredientes_texto: '600 g de lomo de venado limpio, 30 g de corteza de abedul seca (o pan de centeno muy tostado molido), tomillo silvestre, enebro molido, 1 apionabo grande, 100 g de mantequilla ahumada, 200 ml de nata, sal, aceite neutro',
    tags: ['horno', 'baja_temperatura', 'costra', 'caza', 'ahumado', 'nórdico_avanzado'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Mezcla la corteza de abedul molida (o el pan de centeno tostado) con el tomillo desmenuzado y el enebro. Esta costra aporta aromas del bosque. Seca el lomo de venado con papel, sala y deja templar 20 minutos.', tiempo_estimado: 25 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Sella el lomo en sartén con aceite a fuego muy alto, 1 minuto por cara. El venado es magro: un sellado lento hace que los jugos escapen y la carne quede seca. Retira y deja enfriar ligeramente.', tiempo_estimado: 5 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Cubre el exterior del lomo con una capa fina de mostaza de Dijon (actúa como pegamento). Pasa por la mezcla de corteza de abedul apretando para que adhiera. Hornea a 130 °C hasta alcanzar 58 °C en el centro (termómetro de sonda), aproximadamente 25 minutos.', tiempo_estimado: 35 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Puré de apionabo: pela y trocea el apionabo. Cuece en agua salada hasta que esté muy tierno. Tritura con la mantequilla ahumada y la nata hasta obtener un puré sedoso. Sala y añade unas gotas de humo líquido si la mantequilla no es suficientemente ahumada.', tiempo_estimado: 25 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Reposa el venado 5 minutos. Corta en medallones de 2 cm. Sirve sobre el puré de apionabo con los jugos del asado y una rama de tomillo silvestre.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × FUSION × TRADICIONAL
  await crearReceta({
    titulo: 'Curry de garbanzos y espinacas con arroz basmati',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.FUSION,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 35,
    ingredientes_texto: '2 botes de garbanzos cocidos (800 g), 200 g de espinacas frescas, 1 bote de leche de coco (400 ml), 2 tomates maduros, 1 cebolla, 3 dientes de ajo, 1 trozo de jengibre fresco, 2 cucharaditas de curry en polvo, 1 cucharadita de cúrcuma, comino, aceite de oliva, sal, 300 g de arroz basmati',
    tags: ['hervido', 'guiso', 'curry', 'vegano', 'legumbre', 'coco'],
    bloques: [
      { tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Pica la cebolla fina y sofríe en aceite a fuego medio 8 minutos hasta que dore. Añade el ajo y el jengibre rallados, el curry, la cúrcuma y el comino. Rehoga 2 minutos hasta que las especias aromen.', tiempo_estimado: 12 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Incorpora los tomates troceados y cocina 5 minutos hasta que se deshagan. Añade la leche de coco y los garbanzos escurridos. Cocina a fuego medio 15 minutos hasta que la salsa espese.', tiempo_estimado: 20 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Incorpora las espinacas frescas y cocina 2 minutos más. Se reducen mucho. Cuece el arroz basmati en agua salada con una pizca de cúrcuma.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Sirve el curry sobre el arroz basmati. Acompaña con pan naan si tienes o con yogur natural para suavizar el picante.', tiempo_estimado: null },
    ],
  });

  // PRINCIPAL × FUSION × PROFESIONAL
  await crearReceta({
    titulo: 'Pulled pork con salsa bourbon y brioche casero',
    categoria_menu: CategoriaMenu.PRINCIPAL,
    estilo_culinario: EstiloCulinario.FUSION,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 480,
    ingredientes_texto: '1,5 kg de paleta de cerdo deshuesada, 2 cucharadas de pimentón ahumado, 1 cucharada de ajo en polvo, 1 cucharada de azúcar moreno, sal, pimienta, 100 ml de bourbon, 200 ml de salsa BBQ, 2 cucharadas de miel, 4 bollos de brioche',
    tags: ['horno', 'baja_temperatura', 'glaseado', 'americano', 'cerdo', 'largo'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Mezcla el pimentón ahumado, ajo en polvo, azúcar moreno, sal y pimienta. Frota toda la superficie de la paleta con esta mezcla (dry rub). Envuelve en film y refrigera mínimo 8 horas (idealmente 24 h).', tiempo_estimado: 15 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Precalienta el horno a 120 °C. Coloca la paleta en bandeja con rejilla. Introduce termómetro de sonda. Hornea hasta que la temperatura interior alcance 93 °C, unas 6-8 horas. A esa temperatura el colágeno se convierte en gelatina y la carne se deshace.', tiempo_estimado: 450 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Salsa bourbon: en cazo, flamea el bourbon con cuidado. Añade la salsa BBQ y la miel. Reduce 10 minutos hasta que espese y brille.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Retira la paleta y deshilacha (pull) con dos tenedores. La carne debe separarse sola sin resistencia. Mezcla con la mitad de la salsa bourbon.', tiempo_estimado: 15 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Tuesta los brioches. Rellena generosamente con el pulled pork. Añade más salsa bourbon por encima. Opcional: encurtidos o slaw de col para contrastar la grasa.', tiempo_estimado: null },
    ],
  });

  // POSTRE × MEDITERRANEO × TRADICIONAL
  await crearReceta({
    titulo: 'Tarta de Santiago',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.MEDITERRANEO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 55,
    ingredientes_texto: '250 g de almendra molida, 250 g de azúcar, 4 huevos, 1 limón (ralladura), 1 naranja (ralladura), 1 cucharadita de canela molida, 1 cucharada de licor de orujo (opcional), azúcar glas para decorar',
    tags: ['horno', 'sin_gluten', 'almendra', 'gallego', 'húmedo'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Bate los huevos con el azúcar hasta que la mezcla blanquee y doble su volumen. Incorpora la almendra molida, la canela, la ralladura de limón y naranja y el orujo. Mezcla con movimientos envolventes para no perder el aire.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Vierte la masa en molde de 24 cm engrasado y enharinado (usa almendra molida en lugar de harina para esta receta sin gluten). Hornea a 180 °C durante 35-40 minutos. La tarta es húmeda: el palillo debe salir con algunas migas pegadas, no limpio.', tiempo_estimado: 45 },
      { tipo: TipoBloque.ESPERAR, orden: 3, contenido: 'Deja enfriar completamente en el molde antes de desmoldar. Si desmoldas en caliente se romperá.', tiempo_estimado: 60 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Coloca la plantilla de la Cruz de Santiago sobre la tarta y espolvorea azúcar glas. Retira la plantilla con cuidado. Sirve a temperatura ambiente.', tiempo_estimado: null },
    ],
  });

  // POSTRE × MEDITERRANEO × PROFESIONAL
  await crearReceta({
    titulo: 'Coulant de chocolate negro con helado de vainilla de bourbon',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.MEDITERRANEO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 45,
    ingredientes_texto: '200 g de chocolate negro 70%, 100 g de mantequilla, 4 huevos, 4 yemas, 120 g de azúcar, 40 g de harina, cacao en polvo, 500 ml de nata para montar, 300 ml de leche, 1 vaina de vainilla, 5 yemas para el helado, 150 g de azúcar para el helado, 50 ml de bourbon',
    tags: ['horno', 'helado', 'chocolate', 'coulant', 'preciso', 'tiempo_exacto'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Helado de vainilla bourbon: infusiona la vaina abierta en la leche y nata caliente. Bate yemas con azúcar, vierte la mezcla caliente en hilo fino sin dejar de batir (anglesa). Cuece a 82 °C sin superar esa temperatura. Añade el bourbon, enfría en baño de hielo y turbina en heladora. Congela mínimo 4 horas.', tiempo_estimado: 30 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Funde el chocolate con la mantequilla al baño maría hasta que estén completamente integrados y brillantes. Bate los huevos, las yemas y el azúcar hasta que tripliquen volumen. Une ambas mezclas con espátula, añade la harina tamizada con movimientos suaves.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ESPERAR, orden: 3, contenido: 'Rellena moldes individuales engrasados y enharinados con cacao. Refrigera al menos 2 horas (o hasta 24 h). El reposo en frío es lo que garantiza el interior líquido al hornear.', tiempo_estimado: 120 },
      { tipo: TipoBloque.COCINAR, orden: 4, contenido: 'Hornea a 200 °C exactamente 10 minutos. El tiempo es crítico: 8 minutos queda crudo, 12 minutos queda cocido. Cada horno es distinto, haz una prueba primero.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Desmolda directamente sobre el plato y presenta con la bola de helado de vainilla bourbon al lado, sin pausa. El contraste caliente-frío es la gracia del plato.', tiempo_estimado: null },
    ],
  });

  // POSTRE × LATINO × TRADICIONAL
  await crearReceta({
    titulo: 'Tres leches colombiano',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.LATINO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 60,
    ingredientes_texto: '4 huevos, 200 g de azúcar, 200 g de harina, 1 cucharadita de levadura, 1 bote de leche condensada (397 g), 1 bote de leche evaporada (410 ml), 200 ml de nata para montar, 200 ml de nata para el merengue, 100 g de azúcar para el merengue, 1 cucharadita de vainilla',
    tags: ['horno', 'merengue', 'bizcocho', 'húmedo', 'colombiano', 'festivo'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Bate los huevos con el azúcar hasta que blanqueen y tripliquen volumen. Incorpora la harina tamizada con la levadura con movimientos envolventes. Vierte en molde rectangular engrasado.', tiempo_estimado: 15 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Hornea a 175 °C durante 30-35 minutos hasta que al pinchar con palillo salga limpio. El resultado: un bizcocho esponjoso y de buen volumen, listo para empapar.', tiempo_estimado: 35 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Mezcla las tres leches: leche condensada, evaporada y nata con la vainilla. Mientras el bizcocho está aún tibio, pincha toda la superficie con un tenedor y vierte la mezcla de leches poco a poco para que se absorba. Refrigera 4 horas mínimo.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Monta la nata con el azúcar hasta obtener merengue firme. Cubre el bizcocho empapado con una capa generosa.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Tuesta el merengue con soplete hasta que tenga manchas doradas. Sirve bien frío cortado en cuadrados.', tiempo_estimado: null },
    ],
  });

  // POSTRE × LATINO × PROFESIONAL
  await crearReceta({
    titulo: 'Churros con espuma de chocolate a la taza y sal ahumada',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.LATINO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 40,
    ingredientes_texto: '250 ml de agua, 125 g de harina, 30 g de mantequilla, sal, aceite para freír, 200 g de chocolate negro 60%, 400 ml de leche entera, 2 cucharadas de almidón de maíz, 200 ml de nata, sal ahumada en escamas, azúcar y canela para rebozar',
    tags: ['fritura', 'sifón', 'espuma', 'chocolate', 'churros', 'español_latino'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Masa choux: hierve el agua con la mantequilla y la sal. Fuera del fuego, añade la harina de golpe y mezcla energéticamente hasta obtener una masa que se despegue de las paredes. Introduce en manga pastelera con boquilla estrellada.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Fríe los churros en aceite a 180 °C extrusionando directamente sobre el aceite y cortando con tijeras. Fríe en tandas pequeñas para no bajar la temperatura. Deben quedar dorados y crujientes (3-4 minutos). Escurre y reboza en azúcar con canela.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Chocolate para sifón: funde el chocolate en la leche caliente con el almidón. Cocina removiendo hasta que espese ligeramente. Monta la nata e incorpórala fuera del fuego. Carga en sifón con dos cargas de N₂O. Mantén en baño maría a 60 °C.', tiempo_estimado: 15 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Sirve los churros calientes con el chocolate en espuma descargado en vaso o cuenco. Termina con tres escamas de sal ahumada sobre el chocolate. La sal amplifica el amargor del chocolate.', tiempo_estimado: null },
    ],
  });

  // POSTRE × ASIATICO × TRADICIONAL
  await crearReceta({
    titulo: 'Mochi de matcha y pasta de judía roja',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.ASIATICO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 50,
    ingredientes_texto: '200 g de harina de arroz glutinoso (mochiko), 200 g de azúcar, 300 ml de agua, 2 cucharaditas de té matcha en polvo, 200 g de pasta de judía roja azuki (anko), fécula de patata o maíz para trabajar',
    tags: ['vapor', 'japonés', 'arroz_glutinoso', 'matcha', 'dulce', 'sin_gluten'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Mezcla la harina de arroz, el azúcar y el matcha. Añade el agua poco a poco mezclando hasta obtener una masa homogénea sin grumos y de color verde jade. La textura debe ser como una papilla espesa.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Cuece la masa al vapor durante 20 minutos, removiendo cada 5 minutos con espátula húmeda. La masa estará lista cuando sea elástica, pegajosa y translúcida.', tiempo_estimado: 25 },
      { tipo: TipoBloque.ESPERAR, orden: 3, contenido: 'Deja enfriar ligeramente hasta poder manipularla. Espolvorea fécula sobre la superficie de trabajo.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Divide la masa en 12 porciones. Aplana cada una con las manos enharinadas en fécula, coloca una cucharadita de anko en el centro y cierra presionando los bordes. La masa es pegajosa: trabaja rápido y con las manos siempre enharinadas.', tiempo_estimado: 15 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Coloca cada mochi con el cierre hacia abajo. Espolvorea con un poco de matcha adicional. Conserva en nevera no más de 24 horas: la masa se endurece con el tiempo.', tiempo_estimado: null },
    ],
  });

  // POSTRE × ASIATICO × PROFESIONAL
  await crearReceta({
    titulo: 'Pavlova de lichi y crema de coco con gel de maracuyá',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.ASIATICO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 90,
    ingredientes_texto: '4 claras de huevo, 220 g de azúcar, 1 cucharadita de vinagre blanco, 1 cucharadita de almidón de maíz, 400 ml de crema de coco, 2 cucharadas de azúcar glas, 200 g de lichis en conserva, 100 ml de zumo de maracuyá, 2 g de agar-agar',
    tags: ['horno', 'merengue_suizo', 'gel', 'crema_coco', 'tropical', 'precisión'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Merengue suizo: calienta las claras con el azúcar al baño maría removiendo hasta 60 °C y que el azúcar se disuelva completamente. Bate a máxima velocidad hasta obtener un merengue firme y brillante que forme picos duros. Añade el vinagre y el almidón al final.', tiempo_estimado: 20 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Extiende el merengue en círculo de 20 cm sobre papel sulfurizado, creando un reborde más alto. Hornea a 120 °C durante 60 minutos. Apaga el horno y deja enfriar dentro con la puerta entreabierta. No abras el horno durante la cocción.', tiempo_estimado: 70 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Gel de maracuyá: calienta el zumo con el agar-agar hasta hervir 2 minutos. Vierte en bandeja plana y deja solidificar. Tritura para obtener un gel fluido. Monta la crema de coco bien fría con el azúcar glas hasta que forme picos suaves.', tiempo_estimado: 15 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Monta la pavlova al momento de servir: crema de coco montada en el hueco del merengue, lichis frescos o en conserva escurridos y puntos de gel de maracuyá aplicados con biberón. No montes con anticipación: el merengue se humedece.', tiempo_estimado: null },
    ],
  });

  // POSTRE × NORDICO × TRADICIONAL
  await crearReceta({
    titulo: 'Kanelbullar - bollos suecos de canela',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.NORDICO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 120,
    ingredientes_texto: '500 g de harina de fuerza, 250 ml de leche tibia, 75 g de mantequilla para la masa, 80 g de azúcar, 7 g de levadura seca, 1 huevo, 2 cucharaditas de cardamomo molido, 100 g de mantequilla para el relleno, 100 g de azúcar moreno, 2 cucharadas de canela molida, perlas de azúcar para decorar',
    tags: ['horno', 'levadura', 'bollería', 'canela', 'sueco', 'fika'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Disuelve la levadura en la leche tibia. En un cuenco grande, mezcla la harina con el azúcar y el cardamomo. Añade la leche con levadura, el huevo y la mantequilla ablandada. Amasa durante 10 minutos hasta obtener una masa lisa y elástica que no se pegue.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ESPERAR, orden: 2, contenido: 'Cubre la masa con un paño húmedo y deja levar en lugar cálido durante 60 minutos hasta que doble su volumen.', tiempo_estimado: 60 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Estira la masa en rectángulo fino (3 mm). Cubre con la mantequilla reblandecida, el azúcar moreno y la canela. Enrolla apretado por el lado largo. Corta en porciones de 3 cm y coloca en moldes de papel de brioche o en bandeja.', tiempo_estimado: 20 },
      { tipo: TipoBloque.ESPERAR, orden: 4, contenido: 'Segunda fermentación: deja levar 30 minutos más cubiertos con paño. Los bollos deben hincharse notablemente.', tiempo_estimado: 30 },
      { tipo: TipoBloque.COCINAR, orden: 5, contenido: 'Pinta con huevo batido y espolvorea perlas de azúcar. Hornea a 200 °C durante 12-15 minutos hasta que estén dorados. Vigila: se doran rápido.', tiempo_estimado: 15 },
      { tipo: TipoBloque.FIN, orden: 6, contenido: 'Deja enfriar sobre rejilla. Se comen templados el mismo día o se congelan recién enfriados. Acompaña con café negro sueco.', tiempo_estimado: null },
    ],
  });

  // POSTRE × NORDICO × PROFESIONAL
  await crearReceta({
    titulo: 'Tarta de queso nórdica con gel de arándanos y crumble de centeno',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.NORDICO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 90,
    ingredientes_texto: '100 g de harina de centeno, 60 g de mantequilla fría, 30 g de azúcar, sal, 500 g de queso crema, 150 g de azúcar, 3 huevos, 200 ml de nata agria (crème fraîche), 1 limón, 200 g de arándanos frescos, 50 g de azúcar para el gel, 2 g de agar-agar',
    tags: ['horno', 'baño_maría', 'gel', 'queso', 'centeno', 'nórdico_moderno'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Crumble de centeno: mezcla harina de centeno, azúcar y sal. Frota la mantequilla fría en cubos hasta obtener textura de arena gruesa. Extiende en bandeja y hornea a 170 °C 15 minutos hasta que dore. Enfría y desmorona. Compacta en el fondo del molde desmontable.', tiempo_estimado: 20 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Relleno: bate el queso crema con el azúcar hasta que sea completamente liso. Incorpora los huevos uno a uno. Añade la crème fraîche y la ralladura de limón. La mezcla no debe tener grumos ni aire en exceso.', tiempo_estimado: 15 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Vierte el relleno sobre la base. Hornea al baño maría a 160 °C durante 50 minutos. Está lista cuando el centro tiembla ligeramente al mover el molde. Apaga el horno y deja enfriar dentro 30 minutos con la puerta entreabierta para evitar grietas.', tiempo_estimado: 85 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Gel de arándanos: hierve los arándanos con el azúcar y 50 ml de agua 5 minutos. Añade agar-agar y hierve 2 minutos más. Tritura, cuela y vierte sobre la tarta ya fría formando una capa uniforme.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ESPERAR, orden: 5, contenido: 'Refrigera mínimo 4 horas hasta que el gel esté completamente cuajado y la tarta bien fría.', tiempo_estimado: 240 },
      { tipo: TipoBloque.FIN, orden: 6, contenido: 'Desmolda con cuidado pasando un cuchillo por el borde. Sirve en cuñas con el gel brillante visible.', tiempo_estimado: null },
    ],
  });

  // POSTRE × FUSION × TRADICIONAL
  await crearReceta({
    titulo: 'Brownie de tahini y chocolate blanco',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.FUSION,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 45,
    ingredientes_texto: '200 g de chocolate negro 70%, 150 g de mantequilla, 3 huevos, 200 g de azúcar moreno, 100 g de harina, 1 cucharadita de sal, 80 g de tahini, 100 g de chocolate blanco derretido',
    tags: ['horno', 'brownie', 'tahini', 'americano_mediterráneo', 'chocolate'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Funde el chocolate negro con la mantequilla al baño maría. Bate los huevos con el azúcar moreno hasta que blanqueen. Une la mezcla de chocolate con la de huevos. Incorpora la harina tamizada y la sal con espátula.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Vierte la masa en molde cuadrado forrado con papel. Mezcla el tahini con el chocolate blanco derretido. Vierte en puntos sobre la masa y crea el efecto remolino pasando un palillo o brocheta en zigzag.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Hornea a 180 °C durante 22-25 minutos. El brownie tiene que salir húmedo: el palillo con migas pegadas, nunca limpio. Si sale limpio, está pasado.', tiempo_estimado: 25 },
      { tipo: TipoBloque.ESPERAR, orden: 4, contenido: 'Enfría completamente antes de cortar. El brownie es imposible de cortar en caliente: se deshace. En nevera 1 hora mejora mucho la textura.', tiempo_estimado: 60 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Corta en cuadrados con cuchillo limpio. Sirve a temperatura ambiente o ligeramente templado con helado de vainilla.', tiempo_estimado: null },
    ],
  });

  // POSTRE × FUSION × PROFESIONAL
  await crearReceta({
    titulo: 'Semifrío de yuzu y chocolate con tierra de aceite de oliva',
    categoria_menu: CategoriaMenu.POSTRE,
    estilo_culinario: EstiloCulinario.FUSION,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 60,
    ingredientes_texto: '200 g de chocolate blanco, 150 ml de zumo de yuzu (o lima + pomelo), 4 claras de huevo, 200 ml de nata para montar, 4 láminas de gelatina, 50 g de harina, 50 g de mantequilla, 50 g de azúcar, 4 cucharadas de aceite de oliva virgen extra, sal en escamas',
    tags: ['congelado', 'semifrío', 'gelatina', 'tierra', 'yuzu', 'japonés_mediterráneo'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Tierra de aceite de oliva: mezcla harina, azúcar y mantequilla derretida con el aceite de oliva hasta que quede como arena húmeda. Extiende en bandeja y hornea a 160 °C 15 minutos removiendo a mitad de cocción. Enfría: quedará una tierra crujiente con aroma a aceite.', tiempo_estimado: 20 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Hidrata la gelatina en agua fría. Funde el chocolate blanco. Calienta el zumo de yuzu, disuelve la gelatina escurrida y vierte sobre el chocolate. Emulsiona. Monta las claras a punto de nieve y la nata a punto suave. Incorpora en dos tandas a la base de chocolate-yuzu con movimientos envolventes.', tiempo_estimado: 20 },
      { tipo: TipoBloque.ESPERAR, orden: 3, contenido: 'Rellena moldes de silicona individuales o aros forrados con acetato. Congela mínimo 4 horas hasta que esté completamente firme.', tiempo_estimado: 240 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Desmolda sobre plato frío. Rodea con la tierra de aceite de oliva. Termina con sal en escamas y unas gotas de aceite de oliva. El semifrío empieza a fundirse a los 5 minutos: del congelador a la mesa sin escala.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × MEDITERRANEO × TRADICIONAL
  await crearReceta({
    titulo: 'Pan con tomate y jamón ibérico',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.MEDITERRANEO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 10,
    ingredientes_texto: '4 rebanadas de pan de payés o masa madre, 2 tomates maduros de verano, aceite de oliva virgen extra, sal en escamas, 100 g de jamón ibérico de bellota en lonchas finas',
    tags: ['tostado', 'crudo', 'catalán', 'jamón', 'sin_cocción_compleja'],
    bloques: [
      { tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Tuesta el pan en plancha o tostadora hasta que esté dorado y crujiente por fuera. La corteza debe hacer sonido al golpear.', tiempo_estimado: 5 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Corta el tomate por la mitad. Frota el tomate sobre el pan tostado caliente con movimientos circulares hasta que la pulpa quede embebida en el pan. Desecha la piel. Añade una pizca de sal en escamas y riega con aceite de oliva en hilo generoso.', tiempo_estimado: 3 },
      { tipo: TipoBloque.FIN, orden: 3, contenido: 'Coloca las lonchas de jamón ibérico sobre el pan con tomate. El jamón debe estar a temperatura ambiente para que la grasa esté fundida. Se come recién hecho.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × MEDITERRANEO × PROFESIONAL
  await crearReceta({
    titulo: 'Esferificación de aceite de oliva con sal de jamón',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.MEDITERRANEO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 60,
    ingredientes_texto: '100 ml de aceite de oliva virgen extra frutado, 2 g de alginato sódico, 5 g de cloruro cálcico, 1 L de agua, 50 g de jamón ibérico en lonchas finas, sal en escamas',
    tags: ['esferificación', 'gelificación', 'vanguardia', 'jamón', 'aceite', 'técnica_molecular'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Prepara el baño de cloruro cálcico: disuelve 5 g en 1 L de agua fría con batidora. La solución ha de ser completamente transparente. Reserva en recipiente ancho. Prepara el baño de agua limpia para enjuagar las esferas.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Mezcla el aceite con el alginato usando batidora de inmersión durante 3 minutos hasta que esté completamente disuelto. Deja reposar 30 minutos para eliminar las burbujas de aire: las burbujas romperán las esferas.', tiempo_estimado: 35 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Con una cuchara medidora o jeringa, deja caer gotas de la mezcla de aceite-alginato en el baño de cloruro cálcico desde altura de 2-3 cm. Deja actuar 2 minutos sin mover el baño. Las esferas se formarán con una membrana exterior de gel.', tiempo_estimado: 10 },
      { tipo: TipoBloque.COCINAR, orden: 4, contenido: 'Jamón crujiente: extiende las lonchas en papel sulfurizado y hornea a 180 °C durante 8 minutos hasta que estén completamente crujientes y translúcidas. Tritura la mitad hasta obtener polvo fino (sal de jamón).', tiempo_estimado: 12 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Pesca las esferas con cuchara perforada, enjuaga en agua limpia y seca. Coloca sobre el jamón crujiente. Espolvorea polvo de jamón y termina con sal en escamas. Las esferas son frágiles: pasa al plato y lleva a la mesa sin demora.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × LATINO × TRADICIONAL
  await crearReceta({
    titulo: 'Guacamole con totopos de maíz azul',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.LATINO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 15,
    ingredientes_texto: '3 aguacates Hass maduros, 1 tomate mediano, 1/2 cebolla blanca, 2 chiles serrano (o 1 jalapeño), cilantro fresco, lima, sal, totopos de maíz azul',
    tags: ['crudo', 'molcajete', 'mexicano', 'vegano', 'sin_cocción'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Pica el chile muy fino (con o sin semillas según el nivel de picante deseado). Pica el cilantro incluyendo los tallos tiernos. Corta el tomate en brunoise retirando el agua y las semillas. Pica la cebolla muy fina.', tiempo_estimado: 8 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'En el molcajete, machaca primero el chile con la sal hasta obtener una pasta. Añade la mitad del cilantro y sigue machacando. Incorpora el aguacate y aplasta con el tejolote preservando algo de textura irregular: la crema lisa no es guacamole. Añade el tomate, la cebolla y el cilantro restante. Mezcla con movimientos suaves.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 3, contenido: 'Ajusta sal y lima. Presenta en el propio molcajete, recién hecho, con totopos de maíz azul. El guacamole se oxida: no lo prepares con antelación.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × LATINO × PROFESIONAL
  await crearReceta({
    titulo: 'Anticuchos de corazón de res con salsa de ají panca',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.LATINO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 35,
    ingredientes_texto: '400 g de corazón de res limpio, 3 cucharadas de pasta de ají panca, 2 dientes de ajo, 1 cucharadita de comino molido, vinagre de vino tinto, aceite vegetal, sal, pimienta, brochetas de madera remojadas',
    tags: ['parrilla', 'marinado', 'brocheta', 'peruano', 'vísceras', 'street_food'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Limpia el corazón eliminando grasa, nervios y venas con cuchillo afilado. Corta en dados de 3 cm de lado uniforme para garantizar cocción homogénea. Ensarta en brochetas (3-4 trozos por brocheta).', tiempo_estimado: 15 },
      { tipo: TipoBloque.ESPERAR, orden: 2, contenido: 'Prepara la marinada: mezcla el ají panca, el ajo prensado, el comino, el vinagre y el aceite. Marina el corazón ensartado durante 2 horas como mínimo en nevera. El ácido del vinagre ablanda la carne y el ají penetra profundamente.', tiempo_estimado: 120 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Asa las brochetas en parrilla muy caliente, 2-3 minutos por lado. El corazón de res se sirve entre poco hecho y al punto: cocinado en exceso queda muy seco. La superficie debe estar marcada y caramelizada por el azúcar del ají.', tiempo_estimado: 8 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Lleva las brochetas a la mesa recién salidas de la parrilla, con rodajas de patata cocida, choclo y salsa adicional de ají panca. La tradición limeña es comerlos de pie.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × ASIATICO × TRADICIONAL
  await crearReceta({
    titulo: 'Edamame con sal marina y ponzu',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.ASIATICO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 15,
    ingredientes_texto: '400 g de edamame congelado en vainas, sal gruesa, 3 cucharadas de salsa de soja, 2 cucharadas de zumo de limón o yuzu, 1 cucharada de mirin, semillas de sésamo tostado',
    tags: ['hervido', 'japonés', 'vegano', 'rápido', 'soja', 'sano'],
    bloques: [
      { tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Hierve abundante agua con sal gruesa (más salada de lo normal: como el mar). Añade el edamame congelado y cuece 4-5 minutos desde que rompe a hervir. Prueba: las habas deben estar tiernas pero con algo de mordida.', tiempo_estimado: 8 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Escurre y lleva a la mesa en caliente. Prepara el ponzu: mezcla la soja, el zumo de cítrico y el mirin. No cocines el ponzu: es una salsa cruda de aliño.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve el edamame en cuenco con sal en escamas por encima y el ponzu para mojar. Se come extrayendo las habas de las vainas con los dientes. Las vainas no se comen.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × ASIATICO × PROFESIONAL
  await crearReceta({
    titulo: 'Tempura de verduras de temporada con tentsuyu dashi',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.ASIATICO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 30,
    ingredientes_texto: '1 calabacín, 1 berenjena, 4 espárragos, 1 pimiento rojo, 150 g de harina de tempura (o harina floja), agua mineral muy fría o agua con gas helada, aceite de girasol para freír, 200 ml de dashi (caldo de katsuobushi y kombu), 3 cucharadas de salsa de soja, 2 cucharadas de mirin, daikon rallado',
    tags: ['fritura', 'tempura', 'japonés', 'masa_fría', 'crocante', 'verdura'],
    bloques: [
      { tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Corta las verduras en piezas uniformes de tamaño bocado: el calabacín en rodajas de 8 mm, la berenjena en abanico sin separar el tallo, el pimiento en tiras anchas, los espárragos limpios. Seca bien todas las verduras con papel: la humedad arruina la tempura.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Masa de tempura: mezcla la harina con el agua helada justo antes de usar, con palillos y solo 4-5 movimientos. La masa debe tener grumos: el sobre-mezclado activa el gluten y da una tempura dura y grasienta. Mantén la masa sobre un cuenco con hielo durante todo el proceso.', tiempo_estimado: 5 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Tentsuyu (salsa): calienta el dashi con la soja y el mirin hasta que casi hierva. Sirve en cuencos individuales con daikon rallado al lado para mezclar en la salsa.', tiempo_estimado: 5 },
      { tipo: TipoBloque.COCINAR, orden: 4, contenido: 'Calienta el aceite a 175 °C. Pasa cada verdura por la masa y fríe en tandas pequeñas 2-3 minutos. Si el aceite está sucio o baja de temperatura, la tempura absorberá grasa en lugar de formar la costra fina que la define. La tempura lista flota y tiene un color crema pálido, no dorado.', tiempo_estimado: 15 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Escurre en rejilla (no en papel: el vapor reblandece). La tempura no espera: se ablanda en minutos. Pasa directo de la rejilla al plato.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × NORDICO × TRADICIONAL
  await crearReceta({
    titulo: 'Blinis de trigo sarraceno con salmón ahumado y crème fraîche',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.NORDICO,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.MEDIA,
    tiempo_preparacion: 40,
    ingredientes_texto: '100 g de harina de trigo sarraceno, 100 g de harina de trigo, 250 ml de leche tibia, 7 g de levadura seca, 2 huevos, 30 g de mantequilla derretida, sal, 200 g de salmón ahumado en lonchas, 200 g de crème fraîche, cebollino, eneldo, alcaparras',
    tags: ['plancha', 'levadura', 'blini', 'salmón', 'ruso_nórdico', 'fermentado'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Disuelve la levadura en la leche tibia y deja activar 5 minutos. Mezcla ambas harinas con la sal. Une con la leche levada, los huevos y la mantequilla. Bate hasta obtener una masa homogénea sin grumos.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ESPERAR, orden: 2, contenido: 'Cubre y deja reposar en lugar cálido 30 minutos. La masa debe esponjar y aparecer burbujas en la superficie.', tiempo_estimado: 30 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Calienta una plancha antiadherente con una pizca de mantequilla a fuego medio. Vierte una cucharada de masa por blini (unos 6 cm de diámetro). Cuando aparezcan burbujas en la superficie y los bordes estén secos, da la vuelta: 1 minuto por lado.', tiempo_estimado: 15 },
      { tipo: TipoBloque.FIN, orden: 4, contenido: 'Sirve los blinis templados con una cucharada de crème fraîche, una loncha de salmón ahumado doblada, alcaparras y cebollino o eneldo picado. Se comen de un bocado.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × NORDICO × PROFESIONAL
  await crearReceta({
    titulo: 'Tartar de remolacha ahumada con nieve de queso de cabra',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.NORDICO,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 75,
    ingredientes_texto: '4 remolachas medianas, virutas de madera de haya para ahumar, 200 g de queso de cabra fresco, 100 ml de nata, nitrógeno líquido, vinagre balsámico, aceite de avellana, sal en escamas, cebollino',
    tags: ['horno', 'ahumado', 'nitrógeno', 'vanguardia', 'remolacha', 'nieve'],
    bloques: [
      { tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Asa las remolachas envueltas en papel de aluminio a 200 °C durante 50 minutos. Pela y reserva dos enteras para el tartar. Corta una en láminas muy finas con mandolina y deshidrata en horno a 80 °C durante 60 minutos para los chips.', tiempo_estimado: 60 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Ahumado en frío: coloca las remolachas asadas en recipiente hermético con virutas encendidas. Sella y deja ahumar 15 minutos. El aroma debe penetrar sin secar la remolacha.', tiempo_estimado: 20 },
      { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Pica el tartar de remolacha ahumada en brunoise de 5 mm. Aliña con aceite de avellana, vinagre balsámico y sal. Compacta en aro de emplatado.', tiempo_estimado: 10 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Nieve de queso de cabra: tritura el queso con la nata hasta que esté completamente liso. Vierte en hilo fino sobre nitrógeno líquido desde 20 cm de altura. Las gotitas congelan al instante formando nieve. Manipula con guantes criogénicos.', tiempo_estimado: 10 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Retira el aro del tartar. Añade la nieve de queso en el último momento (se sublima en minutos). Termina con los chips de remolacha y cebollino. No hay margen: lleva el plato a la mesa en cuanto esté terminado.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × FUSION × TRADICIONAL
  await crearReceta({
    titulo: 'Hummus clásico con aceite de sésamo negro y pita',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.FUSION,
    modo_preparacion: ModoPreparacion.TRADICIONAL,
    dificultad: Dificultad.FACIL,
    tiempo_preparacion: 15,
    ingredientes_texto: '1 bote de garbanzos cocidos (400 g), 3 cucharadas de tahini, 1 limón, 1 diente de ajo, agua fría, aceite de oliva, aceite de sésamo negro, pimentón dulce, comino, sal, 4 panes de pita',
    tags: ['crudo', 'vegano', 'levantino', 'sin_cocción', 'legumbre', 'rápido'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Tritura los garbanzos escurridos con el tahini, el zumo de limón, el ajo y sal. Añade agua fría cucharada a cucharada hasta conseguir una textura completamente lisa y cremosa. La clave del buen hummus es triturar mucho tiempo (mínimo 4 minutos) y con agua bien fría.', tiempo_estimado: 8 },
      { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Tuesta el pan de pita en plancha caliente o directamente en la llama del gas 30 segundos por lado hasta que hinche y se dore en manchas.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve el hummus en plato hondo formando un pozo en el centro. Llena el pozo con aceite de sésamo negro y un hilo de aceite de oliva. Espolvorea pimentón y comino. Acompaña con el pita tostado cortado en triángulos.', tiempo_estimado: null },
    ],
  });

  // APERITIVO × FUSION × PROFESIONAL
  await crearReceta({
    titulo: 'Bocado de foie micuit con compota de mango y jengibre y sal de sichuan',
    categoria_menu: CategoriaMenu.APERITIVO,
    estilo_culinario: EstiloCulinario.FUSION,
    modo_preparacion: ModoPreparacion.PROFESIONAL,
    dificultad: Dificultad.DIFICIL,
    tiempo_preparacion: 45,
    ingredientes_texto: '200 g de foie mi-cuit de calidad, 1 mango maduro, 1 trozo de jengibre fresco, 1 lima, 2 cucharadas de azúcar moreno, 4 rebanadas finas de brioche, pimienta de Sichuan en grano, sal marina gruesa, cebollino',
    tags: ['sellado', 'compota', 'sal_aromatizada', 'foie', 'asiático_francés', 'bocado'],
    bloques: [
      { tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Compota de mango y jengibre: pela y corta el mango en dados pequeños. Cocina con el azúcar moreno, el jengibre rallado y el zumo de lima a fuego medio durante 10 minutos. El resultado es una compota con trozos visibles, no un puré liso. Enfría completamente.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Sal de Sichuan: tuesta en sartén seca los granos de pimienta de Sichuan 1 minuto hasta que aromen. Mezcla con la sal gruesa en proporciones 1:3 y aplasta en mortero hasta que la pimienta quede en trozos gruesos, no en polvo.', tiempo_estimado: 5 },
      { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Crujiente de brioche: corta en rectángulos de 4 × 2 cm. Tuesta en horno a 160 °C durante 12 minutos hasta que estén completamente secos y dorados. Enfría sobre rejilla.', tiempo_estimado: 15 },
      { tipo: TipoBloque.ELABORAR, orden: 4, contenido: 'Corta el foie mi-cuit en lingotes de 1 cm de grosor con cuchillo calentado en agua caliente y secado (el calor permite un corte limpio). Sella brevemente en sartén muy caliente sin grasa, 15 segundos por cara. El foie se funde rápido: no te despistes.', tiempo_estimado: 5 },
      { tipo: TipoBloque.FIN, orden: 5, contenido: 'Monta el bocado: crujiente de brioche, punto de compota de mango, lingote de foie. Termina con un pellizco de sal de Sichuan y cebollino picado. El foie cede temperatura rápido: pasa a la mesa enseguida.', tiempo_estimado: null },
    ],
  });

  console.log('40 recetas base creadas');

  // RECETAS 41-80
  // Segunda vuelta: 2 recetas por combinación (variante B)

  await crearReceta({ titulo: 'Ensalada niçoise con atún en conserva de calidad', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.MEDITERRANEO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 25, ingredientes_texto: '200 g de patatas pequeñas, 150 g de judías verdes finas, 3 huevos, 1 lata de ventresca de atún en aceite de oliva, 80 g de aceitunas niçoise, 4 tomates cherry, anchoas en salazón, aceite de oliva virgen extra, zumo de limón, sal', tags: ['hervido', 'crudo', 'ensalada', 'provenzal', 'atún', 'sin_cocción_parcial'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Cuece las patatas en agua salada hasta que estén tiernas. Cuece las judías verdes al dente (5 minutos). Cuece los huevos exactamente 9 minutos para que la yema quede firme pero no seca. Enfría todo en agua con hielo para cortar la cocción.', tiempo_estimado: 20 }, { tipo: TipoBloque.FIN, orden: 2, contenido: 'Compone la ensalada sin mezclar: las distintas guarniciones en zonas separadas sobre el plato. Aliña con aceite de oliva y zumo de limón únicamente. Sin vinagreta ni mostaza: la niçoise auténtica es simplísima.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Vitello tonnato piamontés', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.MEDITERRANEO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 120, ingredientes_texto: '500 g de redondo de ternera en pieza, 1 lata de atún en aceite de oliva (160 g), 4 filetes de anchoa en aceite, 2 cucharadas de alcaparras, 2 yemas de huevo, 150 ml de aceite de girasol, zumo de limón, sal, pimienta blanca, caldo de verduras', tags: ['sous_vide', 'emulsión', 'crudo', 'italiano', 'ternera', 'tonnato'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Sella la pieza de ternera en sartén con aceite a fuego alto por todos los lados. Sella al vacío con sal, pimienta y tomillo. Cocina en sous vide a 60 °C durante 90 minutos.', tiempo_estimado: 100 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Salsa tonnato: tritura el atún escurrido con las anchoas, las alcaparras y las yemas hasta obtener una pasta. Emulsiona con el aceite en hilo fino como si fuera mayonesa. Ajusta con limón y sal.', tiempo_estimado: 10 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Corta la ternera fría en lonchas muy finas. Cubre generosamente con la salsa tonnato y termina con alcaparras enteras y pimienta.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Aguachile verde de camarón', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.LATINO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 20, ingredientes_texto: '400 g de camarones frescos pelados y limpios, 2 chiles serrano, 1 pepino, 100 ml de zumo de lima recién exprimido, cilantro, cebolla morada, sal, tostadas de maíz', tags: ['crudo', 'marinado', 'mexicano', 'picante', 'camarón', 'sin_cocción'], bloques: [{ tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Mariposa los camarones abriendo el lomo con cuchillo. Pica la cebolla en juliana y remoja en agua con sal. Corta el pepino en láminas finas con mandolina.', tiempo_estimado: 10 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Licúa el chile serrano con el zumo de lima y el cilantro hasta obtener un líquido verde brillante. Vierte sobre los camarones y marina 8 minutos exactos: el ácido comenzará a desnaturalizar las proteínas del camarón sin cocinarlos completamente.', tiempo_estimado: 10 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve con la cebolla escurrida, láminas de pepino y tostadas de maíz. Añade más lime al gusto.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Causas limeñas rellenas de cangrejo', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.LATINO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 40, ingredientes_texto: '600 g de papa amarilla peruana, 3 cucharadas de pasta de ají amarillo, 50 ml de aceite vegetal, zumo de lima, sal, 200 g de carne de cangrejo, 4 cucharadas de mayonesa, 1 aguacate, cebollino', tags: ['hervido', 'emplatado', 'molde', 'peruano', 'papa', 'aro'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Cuece las papas con piel en agua salada hasta que estén muy tiernas. Pela en caliente y aplasta hasta obtener un puré fino. Incorpora el ají amarillo, el aceite y el zumo de lima hasta que la masa esté suave, elástica y de color amarillo intenso.', tiempo_estimado: 25 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Relleno: mezcla el cangrejo con la mayonesa. Corta el aguacate en dados. En aro de emplatado, coloca una capa de causa, el relleno de cangrejo, dados de aguacate y cierra con otra capa de causa.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Desmolda sobre plato frío. Termina con cebollino y una quenelle de mayonesa.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Ensalada de pepino con vinagre de arroz y sésamo', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.ASIATICO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 15, ingredientes_texto: '2 pepinos japoneses, 3 cucharadas de vinagre de arroz, 1 cucharada de azúcar, 1 cucharadita de sal, 1 cucharadita de aceite de sésamo, guindilla roja, sésamo tostado, cebolleta', tags: ['crudo', 'marinado', 'japonés', 'vegano', 'fresco', 'sin_cocción'], bloques: [{ tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Corta los pepinos en láminas finas con mandolina o a cuchillo. Sala generosamente y deja reposar 10 minutos. Exprime con las manos para eliminar el exceso de agua: sin este paso, el aderezo quedará aguado por el líquido del pepino.', tiempo_estimado: 12 }, { tipo: TipoBloque.FIN, orden: 2, contenido: 'Mezcla el vinagre de arroz, el azúcar, el aceite de sésamo y la guindilla en rodajas. Aliña el pepino escurrido. Sirve frío con sésamo tostado y cebolleta en juliana fina.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Tteokbokki - pastelitos de arroz en salsa gochujang', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.ASIATICO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 25, ingredientes_texto: '400 g de tteok (cilindros de arroz coreanos), 3 cucharadas de gochujang, 1 cucharada de salsa de soja, 1 cucharada de azúcar, 400 ml de caldo dashi, 2 huevos duros, cebolleta, sésamo tostado, aceite de sésamo', tags: ['hervido', 'salsa', 'coreano', 'picante', 'arroz', 'caldo'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Disuelve el gochujang en el caldo dashi caliente junto con la soja y el azúcar. Lleva a ebullición y reduce 5 minutos.', tiempo_estimado: 8 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Añade los tteok y cocina a fuego medio durante 10-12 minutos removiendo con frecuencia hasta que los pastelitos estén tiernos y la salsa espesa y brillante.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve en cuenco con los huevos duros cortados, cebolleta picada, sésamo y unas gotas de aceite de sésamo.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Sopa de remolacha fría con eneldo y nata agria', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.NORDICO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 30, ingredientes_texto: '4 remolachas medianas, 300 ml de kéfir o suero de leche, 1 pepino, eneldo fresco, cebolleta, zumo de limón, sal, nata agria para servir', tags: ['crudo', 'frío', 'fermentado', 'remolacha', 'nórdico', 'sin_cocción_parcial'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Hierve las remolachas con piel hasta que estén muy tiernas (30-40 minutos). Enfría completamente y pela.', tiempo_estimado: 40 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Tritura las remolachas con el kéfir, el zumo de limón y sal hasta obtener una crema lisa de color magenta. Ajusta la consistencia con agua fría. Refrigera 1 hora.', tiempo_estimado: 5 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve bien fría en cuencos con pepino picado, cebolleta, eneldo fresco y una cucharada de nata agria.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Ventresca de bacalao con emulsión de su piel y algas', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.NORDICO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.DIFICIL, tiempo_preparacion: 60, ingredientes_texto: '4 ventrescas de bacalao fresco, piel de bacalao, 300 ml de aceite de oliva suave, 10 g de algas wakame secas, sal en escamas, cebollino, microbrotes', tags: ['confitado', 'emulsión', 'algas', 'bacalao', 'baja_temperatura', 'gelatina_natural'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Coloca la piel de bacalao en agua fría y hierve 20 minutos. El caldo resultante será gelatinoso por el colágeno de la piel. Cuela y reserva.', tiempo_estimado: 25 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Confita las ventrescas en aceite de oliva a 60 °C durante 15 minutos. En su punto, la ventresca se separa en láminas y presenta un color nacarado.', tiempo_estimado: 20 }, { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Emulsión: calienta el caldo de piel gelatinoso, añade el alga wakame rehidratada y tritura. Emulsiona con una parte del aceite de confitar usando batidora de inmersión. La gelatina natural de la piel ligará la emulsión sin necesidad de lecitina.', tiempo_estimado: 10 }, { tipo: TipoBloque.FIN, orden: 4, contenido: 'Coloca la ventresca sobre la emulsión. Termina con sal en escamas, cebollino y microbrotes.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Ensalada de lentejas francesas con vinagreta de mostaza', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.FUSION, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 35, ingredientes_texto: '250 g de lentejas du Puy (pequeñas verdes), 1 zanahoria, 1 rama de apio, 1 cebolla morada, 2 cucharadas de mostaza de Dijon, 4 cucharadas de vinagre de vino blanco, 6 cucharadas de aceite de oliva, perejil fresco, sal, pimienta', tags: ['hervido', 'ensalada_tibia', 'legumbre', 'francés_mediterráneo', 'sin_gluten'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Cuece las lentejas en agua fría sin sal (con sal se endurecen) con la zanahoria y el apio en trozos durante 20-25 minutos. Deben quedar al dente. Sala al final.', tiempo_estimado: 30 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Vinagreta: emulsiona la mostaza con el vinagre y el aceite en hilo fino. Pica la cebolla morada muy fina.', tiempo_estimado: 5 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Escurre las lentejas y aliña tibias con la vinagreta. Añade la cebolla cruda y el perejil picado. Las lentejas tibias absorben mejor el aliño.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Tataki de salmón con vinagreta de miso y sésamo negro', categoria_menu: CategoriaMenu.ENTRANTE, estilo_culinario: EstiloCulinario.FUSION, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 20, ingredientes_texto: '400 g de lomo de salmón sin piel, 4 cucharadas de sésamo negro, 2 cucharadas de miso rojo, 1 cucharada de vinagre de arroz, 1 cucharada de aceite de sésamo, 1 cucharada de miel, rábano daikon, cebollino, sal en escamas', tags: ['plancha', 'crudo', 'sellado', 'japonés_mediterráneo', 'salmón', 'miso'], bloques: [{ tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Seca el salmón y cubre con sésamo negro por todos los lados presionando para que adhiera. Sala justo antes de cocinar.', tiempo_estimado: 5 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Marca en plancha muy caliente sin aceite 30 segundos por cara. El interior permanece crudo y frío: solo la costra exterior cambia. Deja reposar 2 minutos y refrigera 5 minutos.', tiempo_estimado: 8 }, { tipo: TipoBloque.ELABORAR, orden: 3, contenido: 'Vinagreta: disuelve el miso en el vinagre de arroz, añade el aceite de sésamo y la miel. Emulsiona.', tiempo_estimado: 3 }, { tipo: TipoBloque.FIN, orden: 4, contenido: 'Corta en lonchas de 5 mm. Riega con la vinagreta de miso. Termina con daikon rallado fino, cebollino y sal en escamas.', tiempo_estimado: null }] });

  // Completamos con recetas más compactas para los principales restantes
  await crearReceta({ titulo: 'Risotto de parmesano y azafrán alla milanese', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.MEDITERRANEO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 35, ingredientes_texto: '320 g de arroz arborio o carnaroli, 1 L de caldo de carne caliente, hebras de azafrán, 1 cebolla, 100 ml de vino blanco seco, 80 g de parmesano, 60 g de mantequilla fría, aceite de oliva, sal', tags: ['hervido', 'risotto', 'mantecatura', 'italiano', 'azafrán', 'arroz'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Sofríe la cebolla picada en aceite y mantequilla hasta que sea transparente. Añade el arroz y tuesta 2 minutos removiendo hasta que los granos estén nacarados. Vierte el vino y remueve hasta que evapore.', tiempo_estimado: 8 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Añade el azafrán al caldo caliente. Incorpora el caldo cucharón a cucharón, sin dejar de remover, esperando a que cada adición se absorba antes de la siguiente. Este proceso dura 18-20 minutos.', tiempo_estimado: 20 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Apaga el fuego. Mantecatura: incorpora la mantequilla fría en dados y el parmesano rallado. Mezcla con energía hasta que el risotto sea cremoso. Reposa 2 minutos tapado y sirve.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Dorada a la sal con ali oli suave', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.MEDITERRANEO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 50, ingredientes_texto: '1 dorada de 800 g, 1,5 kg de sal gruesa marina, 2 claras de huevo, 4 dientes de ajo, 150 ml de aceite de oliva virgen extra suave, sal en escamas, limón', tags: ['horno', 'sal', 'costra', 'ali_oli', 'mortero', 'pescado'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Ali oli al mortero: machaca los ajos con sal hasta obtener una pasta. Añade el aceite de oliva suave gota a gota al principio, emulsionando con el mazo de manera constante. Paciencia: la emulsión resultante ha de estar completamente ligada y cremosa.', tiempo_estimado: 15 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Mezcla la sal con las claras. Cama de sal, dorada sin escamar, tapa de sal. Hornea a 220 °C durante 20 minutos.', tiempo_estimado: 25 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Rompe la costra, retira piel y filetea. Sirve con ali oli y limón.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Tacos de birria de res con consomé', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.LATINO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 180, ingredientes_texto: '1 kg de falda de res, 4 chiles guajillo, 2 chiles ancho, 1 chile chipotle en adobo, comino, orégano, canela, ajo, cebolla, tomate, tortillas de maíz, queso Oaxaca, cebolla blanca, cilantro, lima', tags: ['estofado', 'guiso', 'consomé', 'mexicano', 'res', 'tacos'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Tuesta y remoja los chiles. Licúa con ajo, cebolla, tomate, comino, canela y orégano. Cuela.', tiempo_estimado: 20 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Dora la carne. Vierte la salsa y agua. Guisa tapado a fuego bajo durante 2,5 horas hasta que la carne se deshile con dos tenedores.', tiempo_estimado: 150 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Deshila la carne. Moja las tortillas en la grasa del consomé, rellena con carne y queso Oaxaca, dora en comal. Sirve con el consomé en taza aparte.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Ceviche de hongos con leche de tigre vegana', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.LATINO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 30, ingredientes_texto: '300 g de champiñones portobello, 200 g de setas ostra, 1 plátano verde, ají amarillo, lima, cilantro, cebolla morada, apio, jengibre, sal, maíz cancha', tags: ['crudo', 'marinado', 'vegano', 'peruano_moderno', 'hongos', 'sin_cocción'], bloques: [{ tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Limpia los hongos y córtalos en trozos irregulares de tamaño bocado. Pela y corta el plátano verde.', tiempo_estimado: 10 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Licúa el plátano verde cocido con ají amarillo, lima, jengibre, apio y cilantro. Esta es la leche de tigre vegana: ácida, picante y untuosa por el almidón del plátano.', tiempo_estimado: 10 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Marina los hongos en la leche de tigre 5 minutos. Sirve con cebolla morada, cilantro y maíz cancha.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Soba fría con dashi y tempura de langostino', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.ASIATICO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 30, ingredientes_texto: '300 g de fideos soba, 400 ml de dashi, 80 ml de salsa de soja, 60 ml de mirin, 8 langostinos crudos pelados, harina de tempura, agua muy fría, aceite para freír, cebolleta, nori, wasabi', tags: ['hervido', 'fritura', 'tempura', 'japonés', 'frío', 'soba'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Cuece los soba en agua sin sal. Escurre y enfría bajo agua fría corriente. Refrigera. Calienta el dashi con soja y mirin hasta hervir. Enfría completamente.', tiempo_estimado: 15 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Tempura de langostinos: haz un corte ventral para que no se curven. Pasa por masa fría y fríe en aceite a 180 °C 2 minutos.', tiempo_estimado: 10 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve los soba fríos en cuenco con el tsuyu frío aparte. Coloca la tempura encima y acompaña con cebolleta, nori y wasabi.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Curry thai verde con leche de coco y tofu', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.ASIATICO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 40, ingredientes_texto: '400 g de tofu firme, 400 ml de leche de coco, 2 cucharadas de pasta de curry verde, 1 tallo de lemongrass, 3 hojas de lima kaffir, 2 cucharadas de salsa de pescado, 1 cucharada de azúcar de palma, berenjenas tailandesas, albahaca tailandesa, arroz jazmín', tags: ['hervido', 'guiso', 'coco', 'tailandés', 'vegano', 'aromático'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'En wok, fríe la pasta de curry verde en la parte sólida de la leche de coco a fuego alto hasta que aromatice (2 minutos). Añade el lemongrass aplastado y las hojas de kaffir.', tiempo_estimado: 5 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Incorpora el tofu cortado en dados y la leche de coco restante. Añade las berenjenas, la salsa de pescado y el azúcar de palma. Cocina 12 minutos.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Retira el lemongrass y el kaffir. Termina con albahaca tailandesa. Sirve sobre arroz jazmín.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Gravad lax de remolacha con salsa de mostaza sueca', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.NORDICO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 30, ingredientes_texto: '800 g de lomo de salmón, 2 remolachas crudas ralladas, 4 cucharadas de sal gruesa, 3 cucharadas de azúcar, 30 ml de vodka, eneldo fresco, mostaza de Dijon, mostaza dulce sueca, miel, aceite vegetal, pan de centeno', tags: ['curado', 'sin_cocción', 'remolacha', 'vodka', 'salmón', 'escandinavo'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Mezcla la remolacha rallada con la sal, el azúcar, el eneldo y el vodka. Cubre el salmón por ambas caras con esta mezcla.', tiempo_estimado: 10 }, { tipo: TipoBloque.ESPERAR, orden: 2, contenido: 'Envuelve en film apretado y refrigera con peso encima 48 horas. La remolacha teñirá el salmón de rojo intenso.', tiempo_estimado: 2880 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Retira la costra, seca y corta en lonchas finas en diagonal. Sirve con salsa de mostaza sueca (mostazas + miel + aceite + eneldo) y pan de centeno.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Smørrebrød de arenque encurtido y huevo de codorniz', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.NORDICO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 30, ingredientes_texto: '4 rebanadas de pan de centeno denso, arenque encurtido en vinagre, 8 huevos de codorniz, crème fraîche, rábano picante rallado, pepinillo en vinagre, cebolleta, eneldo, mantequilla con sal', tags: ['crudo', 'encurtido', 'hervido', 'danés', 'emplatado', 'arenque'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Cuece los huevos de codorniz exactamente 2 minutos 30 segundos desde agua hirviendo. Enfría en hielo y pela con cuidado.', tiempo_estimado: 8 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Mezcla la crème fraîche con el rábano picante rallado al gusto. Unta el pan de centeno con mantequilla generosa.', tiempo_estimado: 5 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Monta el smørrebrød en capas: crema de rábano, arenques escurridos, pepinillo en rodajas, huevos de codorniz cortados por la mitad, eneldo y cebolleta. El smørrebrød es arte: las capas deben verse.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Shakshuka de pimientos asados y feta', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.FUSION, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 30, ingredientes_texto: '4 huevos, 2 pimientos rojos, 1 bote de tomate triturado (400 g), 1 cebolla, 3 dientes de ajo, 1 cucharadita de comino, 1 cucharadita de pimentón ahumado, chile en copos, 100 g de queso feta, perejil, aceite de oliva, sal, pan de pita', tags: ['horno', 'plancha', 'escalfado', 'norteafricano_mediterráneo', 'vegetariano', 'huevo'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Asa los pimientos directamente sobre la llama o en el horno hasta que la piel esté ennegrecida. Pela, desecha semillas y corta en tiras.', tiempo_estimado: 15 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Sofríe la cebolla y el ajo en aceite. Añade las especias, el tomate y los pimientos. Cocina 10 minutos hasta que espese.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Haz huecos en la salsa y rompe un huevo en cada uno. Tapa y cocina a fuego bajo 5-6 minutos hasta que las claras cuajen y la yema quede líquida. Desmiga el feta encima y sirve con pita.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Ramen de miso con maíz y mantequilla Sapporo', categoria_menu: CategoriaMenu.PRINCIPAL, estilo_culinario: EstiloCulinario.FUSION, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 45, ingredientes_texto: '4 nidos de fideos ramen, 800 ml de caldo de pollo, 4 cucharadas de pasta de miso blanco, 2 cucharadas de pasta de sésamo, maíz dulce en lata, 40 g de mantequilla, 4 rodajas de chashu de cerdo, bambú en conserva, cebolleta, nori, huevo marinado', tags: ['hervido', 'caldo', 'miso', 'japonés_americano', 'mantequilla', 'ramen'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Disuelve el miso y la pasta de sésamo en el caldo de pollo caliente. Ajusta de sal. El tare de miso es el corazón del bowl.', tiempo_estimado: 5 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Cuece los fideos. Saltea el maíz en sartén seca hasta que dore ligeramente.', tiempo_estimado: 10 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Monta: fideos, caldo de miso muy caliente, chashu, maíz, bambú, medio huevo marinado, cebolleta y nori. Finaliza con una nuez de mantequilla que se fundirá en el caldo.', tiempo_estimado: null }] });

  // Postres restantes (compactos)
  await crearReceta({ titulo: 'Crema catalana con sorbete de naranja sanguina', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.MEDITERRANEO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 30, ingredientes_texto: '500 ml de leche entera, 6 yemas, 120 g de azúcar, 30 g de almidón de maíz, 1 rama de canela, ralladura de limón y naranja, azúcar para quemar', tags: ['hervido', 'soplete', 'crema', 'catalán', 'infusión', 'caramelizado'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Infusiona la leche con la canela y las ralladuras. Bate las yemas con el azúcar y el almidón. Vierte la leche caliente en hilo sobre las yemas. Cuece removiendo a fuego bajo hasta espesar.', tiempo_estimado: 20 }, { tipo: TipoBloque.ESPERAR, orden: 2, contenido: 'Reparte en cazuelitas y refrigera 2 horas mínimo.', tiempo_estimado: 120 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Cubre con azúcar fino y quema con soplete formando una capa crujiente uniforme. La costra se ablanda en minutos: lleva a la mesa recién quemada.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Namelaka de chocolate blanco con gel de limón', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.MEDITERRANEO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.DIFICIL, tiempo_preparacion: 45, ingredientes_texto: '300 g de chocolate blanco, 200 ml de leche entera, 2 g de gelatina, 400 ml de nata fría, 150 ml de zumo de limón, 100 g de azúcar, 2 g de agar-agar, 150 g de galleta tipo digestive, 60 g de mantequilla', tags: ['gelatina', 'gel', 'japonés_europeo', 'chocolate_blanco', 'crema_fría', 'crumble'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Namelaka: hidrata la gelatina. Funde el chocolate. Calienta la leche, disuelve la gelatina, vierte sobre el chocolate en tres veces emulsionando. Incorpora la nata fría en hilo con batidora. Refrigera 12 horas.', tiempo_estimado: 20 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Gel de limón: hierve el zumo con el azúcar y el agar-agar 2 minutos. Enfría, tritura hasta obtener gel fluido. Crumble: tritura la galleta con la mantequilla y hornea 10 minutos.', tiempo_estimado: 20 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Coloca el crumble en base. Manga pastelera con la namelaka en quenelles. Puntos de gel de limón. Ralladura de yuzu.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Arroz con leche asturiano', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.LATINO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 60, ingredientes_texto: '200 g de arroz de grano redondo, 1,5 L de leche entera, 150 g de azúcar, 1 rama de canela, cáscara de limón, 1 cucharada de mantequilla, canela molida para servir', tags: ['hervido', 'lento', 'lácteo', 'asturiano', 'tradicional', 'cremoso'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Infusiona la leche con la canela y la cáscara de limón a fuego suave durante 10 minutos. Añade el arroz y cocina a fuego muy bajo durante 45 minutos removiendo frecuentemente para que no se pegue y el almidón vaya espesando el conjunto.', tiempo_estimado: 55 }, { tipo: TipoBloque.FIN, orden: 2, contenido: 'Cuando tenga textura cremosa y el arroz esté completamente cocido, retira la canela y la cáscara. Añade el azúcar y la mantequilla. Sirve en cuencos con canela molida espolvoreada.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Buñuelos de viento con crema pastelera de maracuyá', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.LATINO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 45, ingredientes_texto: '250 ml de agua, 125 g de harina, 4 huevos, 60 g de mantequilla, sal, aceite para freír, 4 yemas, 80 g de azúcar, 30 g de almidón, 200 ml de leche, 100 ml de zumo de maracuyá, azúcar glas', tags: ['fritura', 'choux', 'crema', 'relleno', 'tropical', 'español_latino'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Crema de maracuyá: bate las yemas con azúcar y almidón. Calienta leche con el zumo de maracuyá, vierte sobre las yemas y cuece hasta espesar. Enfría con film a contacto.', tiempo_estimado: 15 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Masa choux: hierve agua, mantequilla y sal. Añade harina de golpe. Fuera del fuego, incorpora los huevos uno a uno. Fríe cucharadas de masa en aceite a 170 °C dando vueltas hasta que los buñuelos estén dorados y huecos (8 min).', tiempo_estimado: 20 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Rellena con manga pastelera fina. Espolvorea azúcar glas y sirve templados.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Taiyaki de chocolate y taro', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.ASIATICO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 40, ingredientes_texto: '200 g de harina, 1 cucharadita de levadura, 1 huevo, 200 ml de leche, 2 cucharadas de azúcar, mantequilla, 200 g de raíz de taro cocida, 3 cucharadas de azúcar, 100 g de chocolate negro, 80 ml de nata', tags: ['plancha', 'molde', 'japonés', 'pasta_taro', 'chocolate', 'gofre'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Aplasta el taro cocido con azúcar hasta obtener pasta. Ganache: funde el chocolate con la nata caliente. Mezcla la masa de taiyaki (harina, levadura, huevo, leche, azúcar).', tiempo_estimado: 15 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Engrasa el molde de taiyaki y calienta. Vierte masa, coloca relleno de taro y chocolate en el centro, cubre con más masa. Cierra y cocina 3 minutos por lado.', tiempo_estimado: 20 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve caliente. El centro debe estar fundido. Acompaña con helado de soja si se desea.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Dorayaki de anko y mantequilla browned', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.ASIATICO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 30, ingredientes_texto: '200 g de harina, 3 huevos, 100 g de azúcar, 1 cucharadita de bicarbonato, 2 cucharadas de miel, 80 ml de agua, 200 g de anko (pasta azuki), 60 g de mantequilla', tags: ['plancha', 'pancake', 'japonés', 'mantequilla_noisette', 'anko', 'dorado'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Bate los huevos con el azúcar y la miel. Añade harina y bicarbonato. Diluye con agua hasta masa de pancake. Mantequilla noisette: cocina la mantequilla hasta que dore y aromatice a avellana. Enfría.', tiempo_estimado: 10 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Cuece los pancakes en plancha ligeramente engrasada a fuego medio-bajo. Deben tener burbujas en la superficie antes de dar la vuelta. Tamaño de 10 cm.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Rellena dos pancakes con una cucharada generosa de anko y unas gotas de mantequilla noisette. Cierra a modo de sándwich. Sirve templado.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Æbleskiver daneses con mermelada de frutos rojos', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.NORDICO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 35, ingredientes_texto: '250 g de harina, 2 cucharaditas de levadura, 300 ml de suero de leche, 3 huevos, 30 g de mantequilla derretida, 2 cucharadas de azúcar, 1 cucharadita de cardamomo, mantequilla para el molde, 200 g de mermelada de frutos rojos, azúcar glas', tags: ['plancha', 'molde_especial', 'levadura', 'danés', 'esférico', 'buñuelo'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Separa las yemas de las claras. Mezcla las yemas con el suero de leche, la mantequilla, la harina, el azúcar y el cardamomo. Monta las claras a punto de nieve firme e incorpora con movimientos envolventes.', tiempo_estimado: 15 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Calienta el molde æbleskiver con mantequilla en cada cavidad. Rellena 3/4. Cuando se forme costra inferior (1 minuto), gira con palillo 90° cada 30 segundos hasta completar la esfera.', tiempo_estimado: 20 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve con mermelada y azúcar glas. Se comen calientes, dipping en la mermelada.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Kladdkaka - pastel pegajoso de chocolate sueco', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.NORDICO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 25, ingredientes_texto: '150 g de mantequilla, 3 cucharadas de cacao puro en polvo, 2 huevos, 250 g de azúcar, 100 g de harina, 1 cucharadita de vainilla, sal, azúcar glas y nata montada para servir', tags: ['horno', 'húmedo', 'sueco', 'chocolate', 'pocos_ingredientes', 'kladdkaka'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Funde la mantequilla con el cacao. Bate los huevos con el azúcar y la vainilla. Une ambas mezclas. Añade la harina y la sal: mezcla lo mínimo, solo hasta integrar.', tiempo_estimado: 10 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Vierte en molde de 20 cm engrasado. Hornea a 175 °C exactamente 15 minutos. El centro debe estar completamente húmedo y tembloroso. Si el palillo sale limpio, está estropeado.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Deja enfriar completamente en el molde. Espolvorea azúcar glas. Sirve en cuñas con nata montada. La textura correcta es casi líquida en el centro.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Tarta de lima key con base de galleta y merengue italiano', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.FUSION, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 45, ingredientes_texto: '200 g de galletas tipo digestive, 80 g de mantequilla, 4 yemas, 400 ml de leche condensada, 120 ml de zumo de lima fresco, 4 claras, 200 g de azúcar, 80 ml de agua, ralladura de lima', tags: ['horno', 'merengue_italiano', 'lima', 'americano_mediterráneo', 'ácido', 'tarta'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Tritura las galletas con la mantequilla derretida. Compacta en molde y hornea 8 minutos a 180 °C.', tiempo_estimado: 15 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Bate las yemas con la leche condensada y el zumo de lima hasta que se integren y la mezcla se espese ligeramente. Vierte sobre la base y hornea 15 minutos a 160 °C.', tiempo_estimado: 20 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Merengue italiano: cuece el azúcar con el agua a 121 °C y vierte en hilo sobre las claras montadas. Cubre la tarta fría y tuesta con soplete.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Baklava de pistacho y agua de rosas', categoria_menu: CategoriaMenu.POSTRE, estilo_culinario: EstiloCulinario.FUSION, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 60, ingredientes_texto: '300 g de pasta filo, 150 g de mantequilla clarificada, 200 g de pistacho pelado sin sal, 200 g de azúcar, 150 ml de agua, 2 cucharadas de agua de rosas, 1 cucharadita de cardamomo molido, canela', tags: ['horno', 'filo', 'almíbar', 'pistacho', 'otomano', 'mantequilla_clarificada'], bloques: [{ tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Tuesta ligeramente los pistachos y pica grueso. Clarifica la mantequilla fundiendo y retirando la espuma y el suero. Solo queda la grasa pura, que permite temperaturas más altas sin quemarse.', tiempo_estimado: 15 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Pinta cada lámina de filo con mantequilla clarificada. Alterna 6 capas, esparce el pistacho, 6 capas más. Corta en rombos antes de hornear.', tiempo_estimado: 20 }, { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Hornea a 180 °C durante 25 minutos hasta que esté dorado. Mientras, prepara el almíbar hirviendo el azúcar con el agua, el agua de rosas y el cardamomo durante 10 minutos.', tiempo_estimado: 30 }, { tipo: TipoBloque.FIN, orden: 4, contenido: 'Vierte el almíbar caliente sobre el baklava recién salido del horno. Deja empapar 2 horas antes de servir.', tiempo_estimado: null }] });

  // Aperitivos restantes
  await crearReceta({ titulo: 'Croquetas de jamón ibérico y queso manchego', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.MEDITERRANEO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 60, ingredientes_texto: '100 g de jamón ibérico picado, 60 g de queso manchego rallado, 80 g de mantequilla, 80 g de harina, 600 ml de leche entera, nuez moscada, sal, pimienta blanca, 2 huevos, pan rallado, aceite para freír', tags: ['fritura', 'bechamel', 'jamón', 'español', 'crema', 'rebozado'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Bechamel: funde la mantequilla, añade la harina y tuéstala 2 minutos (roux). Incorpora la leche caliente de golpe y bate sin parar hasta que espese y se despegue de las paredes. Añade el jamón, el queso, la nuez moscada y sal. Extiende en bandeja y enfría en nevera 3 horas mínimo.', tiempo_estimado: 20 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Forma las croquetas con dos cucharas o a mano. Pasa por harina, huevo y pan rallado en ese orden.', tiempo_estimado: 20 }, { tipo: TipoBloque.COCINAR, orden: 3, contenido: 'Fríe en aceite abundante a 180 °C hasta que estén doradas uniformemente (2-3 minutos). Escurre sobre papel; la costra crujiente aguanta poco: al plato.', tiempo_estimado: 10 }, { tipo: TipoBloque.FIN, orden: 4, contenido: 'Sirve calientes con alioli o mayonesa de limón. El interior debe estar líquido y cremoso al romper.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Bombas de patata con picadillo y salsa brava', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.MEDITERRANEO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 45, ingredientes_texto: '600 g de patatas harinosas, 200 g de carne picada mixta, tomate frito, ajo, pimentón, comino, 2 huevos, pan rallado, aceite para freír, 200 ml de tomate triturado, cayena, vinagre', tags: ['fritura', 'relleno', 'barcelonés', 'patata', 'salsa_brava', 'empanadilla'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Cuece las patatas y haz puré sin grumos. Sofríe el picadillo con ajo, pimentón y comino. Mezcla con un poco de tomate frito.', tiempo_estimado: 25 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Salsa brava: sofríe ajo, añade tomate, cayena, vinagre y cocina 10 minutos. Tritura hasta que quede suave y brillante. Forma las bombas con puré, relleno de carne en el centro, puré para cerrar. Empana en huevo y pan rallado.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Fríe a 180 °C hasta que estén doradas. Sirve con salsa brava caliente.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Patacones con hogao y queso costeño', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.LATINO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 25, ingredientes_texto: '2 plátanos verdes, aceite para freír, 2 tomates maduros, 1 cebolla blanca, 2 dientes de ajo, 80 g de queso costeño o queso fresco, aceite de oliva, sal, comino', tags: ['fritura', 'plátano', 'colombiano', 'doble_fritura', 'vegetal', 'queso'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Pela el plátano y corta en rodajas de 2 cm. Primera fritura a 160 °C hasta que estén ligeramente dorados. Retira, aplana con el tostonera o un vaso y saborea con sal.', tiempo_estimado: 10 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Hogao: sofríe la cebolla y el ajo. Añade el tomate rallado y cocina hasta que espese y tenga sabor concentrado (10 minutos). Sazona con comino y sal. Segunda fritura de los patacones a 180 °C hasta que estén crujientes y dorados.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve con el hogao caliente encima y el queso costeño desmenuzado.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Tequeños de queso blanco venezolano', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.LATINO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 40, ingredientes_texto: '250 g de harina, 125 g de mantequilla fría, 1 huevo, 1 cucharadita de azúcar, sal, 200 g de queso blanco venezolano o queso fresco firme, aceite para freír', tags: ['fritura', 'venezolano', 'queso', 'masa', 'aperitivo', 'frito'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Mezcla la harina con la mantequilla fría en cubos hasta textura de arena. Añade el huevo, el azúcar y la sal. Amasa poco hasta obtener masa homogénea que no se pegue. Refrigera 15 minutos.', tiempo_estimado: 20 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Corta el queso en bastones. Extiende porciones de masa fina y enrolla alrededor del queso en espiral, sellando bien los extremos.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Fríe en aceite a 175 °C hasta que estén dorados uniformemente (3-4 minutos). Salen mejor recién fritos: el queso fundido en el interior es el punto.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Kushiyaki de pollo con salsa tare de soja y miel', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.ASIATICO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 30, ingredientes_texto: '400 g de muslo de pollo deshuesado, 4 cucharadas de salsa de soja, 2 cucharadas de mirin, 2 cucharadas de sake, 1 cucharada de miel, cebolleta, pimienta sansho, sal, brochetas de bambú', tags: ['parrilla', 'lacado', 'japonés', 'pollo', 'brocheta', 'tare'], bloques: [{ tipo: TipoBloque.PREPARAR, orden: 1, contenido: 'Corta el pollo en dados de 3 cm. Ensarta alternando con trozos de cebolleta. Prepara el tare: reduce soja, mirin, sake y miel en cazo hasta que espese y brille (10 minutos).', tiempo_estimado: 15 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Asa las brochetas en parrilla o en sartén de hierro a fuego alto. Cuando estén casi hechas, pincela con el tare y termina caramelizando la salsa sobre la carne (2 aplicaciones).', tiempo_estimado: 12 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve con una pizca de sansho molido y sal de limón (sal con ralladura de limón).', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Okonomiyaki osaka con mayonesa japonesa y bonito seco', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.ASIATICO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 30, ingredientes_texto: '150 g de harina, 200 ml de caldo dashi, 2 huevos, 300 g de col china picada fina, 100 g de bacon en lonchas finas, camarones secos, 1 cucharada de yamato imo (yam rallado) opcional, salsa okonomiyaki o worcestershire+ketchup, mayonesa Kewpie, katsuobushi (bonito seco), alga aonori', tags: ['plancha', 'tortilla', 'japonés_osaka', 'col', 'bacon', 'mayonesa_japonesa'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Mezcla harina, dashi, huevos y el yam si tienes. Incorpora la col bien picada y los camarones. La masa debe ser espesa.', tiempo_estimado: 8 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Extiende la masa en plancha engrasada a fuego medio formando un círculo de 20 cm. Coloca el bacon encima. Tapa y cocina 5 minutos. Da la vuelta con espátula grande con decisión. 5 minutos más.', tiempo_estimado: 15 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Pinta con salsa okonomiyaki, dibuja espirales de mayonesa Kewpie. Cubre con katsuobushi (bailará con el calor) y aonori. Sirve en la propia plancha si puedes.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Räksmörgås - tostada abierta de gambas nórdica', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.NORDICO, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 15, ingredientes_texto: '4 rebanadas de pan de centeno, mantequilla, 300 g de gambas cocidas peladas, 3 cucharadas de mayonesa, eneldo fresco, 2 huevos duros, lechuga mantecosa, 1 limón, sal, pimienta blanca', tags: ['crudo', 'mayonesa', 'nórdico', 'gamba', 'tostada_abierta', 'rápido'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Mezcla la mayonesa con el eneldo picado. Unta el pan de centeno con mantequilla generosa. Coloca una hoja de lechuga.', tiempo_estimado: 5 }, { tipo: TipoBloque.FIN, orden: 2, contenido: 'Monta las gambas sobre la lechuga. Añade rodajas de huevo duro, un punto de mayonesa de eneldo y acaba con eneldo fresco y un gajo de limón. Lleva a la mesa recién montado.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Tartine de remolacha fermentada y labneh', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.NORDICO, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 20, ingredientes_texto: '4 rebanadas de pan de masa madre, 200 g de remolacha fermentada (o en vinagre), 200 g de yogur griego escurrido 24h (labneh), semillas de girasol, semillas de sésamo, miel de tomillo, aceite de oliva, sal en escamas, microbrotes de remolacha', tags: ['tostado', 'fermentado', 'labneh', 'nórdico_levantino', 'semillas', 'bocado'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Tuesta el pan en horno a 190 °C durante 5 minutos hasta que esté crujiente. Tuesta las semillas en sartén seca 2 minutos.', tiempo_estimado: 8 }, { tipo: TipoBloque.ELABORAR, orden: 2, contenido: 'Extiende el labneh sobre el pan con el dorso de la cuchara creando ondas. Coloca la remolacha fermentada escurrida y cortada.', tiempo_estimado: 5 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Termina con las semillas tostadas, un hilo de miel, aceite de oliva y sal en escamas. Microbrotes si tienes. Lleva al momento: las semillas pierden el crujiente con el calor del pan.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Nachos con queso fundido al momento y pico de gallo', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.FUSION, modo_preparacion: ModoPreparacion.TRADICIONAL, dificultad: Dificultad.FACIL, tiempo_preparacion: 20, ingredientes_texto: '200 g de totopos de maíz, 200 g de queso cheddar rallado, 100 ml de cerveza, 1 jalapeño, 2 tomates, 1/2 cebolla, cilantro, lima, sal', tags: ['fundido', 'crudo', 'tex_mex', 'queso', 'rápido', 'compartir'], bloques: [{ tipo: TipoBloque.ELABORAR, orden: 1, contenido: 'Pico de gallo: pica los tomates, la cebolla y el cilantro en brunoise fina. Aliña con lima y sal. Reposa 10 minutos para que los jugos se integren.', tiempo_estimado: 10 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Salsa de queso: calienta la cerveza en cazo, añade el cheddar poco a poco removiendo. El queso debe fundirse formando una salsa lisa. Añade el jalapeño picado.', tiempo_estimado: 8 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Sirve los totopos con la salsa de queso caliente en cuenco separado, el pico de gallo fresco y guacamole. Para compartir.', tiempo_estimado: null }] });

  await crearReceta({ titulo: 'Pintxo de foie y manzana caramelizada sobre pan vasco', categoria_menu: CategoriaMenu.APERITIVO, estilo_culinario: EstiloCulinario.FUSION, modo_preparacion: ModoPreparacion.PROFESIONAL, dificultad: Dificultad.MEDIA, tiempo_preparacion: 20, ingredientes_texto: '4 rebanadas de pan de pueblo o txapela, 200 g de foie fresco de pato, 2 manzanas golden, 2 cucharadas de mantequilla, 2 cucharadas de azúcar moreno, 30 ml de calvados, sal en escamas, pimienta negra, brotes tiernos', tags: ['plancha', 'caramelizado', 'flameado', 'vasco_francés', 'foie', 'pintxo'], bloques: [{ tipo: TipoBloque.COCINAR, orden: 1, contenido: 'Pela y corta las manzanas en láminas. Carameliza con la mantequilla y el azúcar moreno en sartén a fuego medio hasta que estén doradas. Flamea con el calvados con cuidado.', tiempo_estimado: 10 }, { tipo: TipoBloque.COCINAR, orden: 2, contenido: 'Corta el foie en medallones de 1,5 cm. Sartén muy caliente sin grasa. Sella 20 segundos por cara. El foie se funde: trabaja rápido. Sal en escamas y pimienta al sacar.', tiempo_estimado: 5 }, { tipo: TipoBloque.FIN, orden: 3, contenido: 'Monta el pintxo: pan tostado, manzana caramelizada, medallón de foie. Termina con brotes tiernos. El foie cae de temperatura rápido: lleva al comensal sin esperar.', tiempo_estimado: null }] });

  console.log('80 recetas creadas');

  // ANOTACIONES DE ESTILO
  // 20 anotaciones sobre términos culinarios reales.
  // Vinculadas a la receta 1 (gazpacho) como referencia de demostración.
  // En producción, cada autor añadiría las suyas propias a sus recetas.

  const primeraReceta = await prisma.receta.findFirst({
    orderBy: { id: 'asc' },
  });

  if (primeraReceta) {
    await prisma.anotacionEstilo.createMany({
      data: [
        { receta_id: primeraReceta.id, palabra_clave: 'brunoise', explicacion: 'Corte en cubos perfectos de 1-3 mm de lado. Se consigue cortando primero en bastones finos (juliana) y luego transversalmente. Requiere cuchillo afilado y práctica para mantener uniformidad.' },
        { receta_id: primeraReceta.id, palabra_clave: 'juliana', explicacion: 'Corte en tiras finas y alargadas, de unos 5 cm de largo y 1-2 mm de grosor. Es la base para la brunoise. Se utiliza para cocciones rápidas o presentaciones refinadas.' },
        { receta_id: primeraReceta.id, palabra_clave: 'chino', explicacion: 'Colador de malla muy fina con forma cónica. Se usa para colar salsas, cremas y caldos obteniendo una textura completamente lisa, libre de partículas sólidas.' },
        { receta_id: primeraReceta.id, palabra_clave: 'socarrat', explicacion: 'Capa crujiente de arroz tostado que se forma en el fondo de la paella. Es el punto más valorado de la paella valenciana auténtica. Se obtiene subiendo el fuego en los últimos minutos.' },
        { receta_id: primeraReceta.id, palabra_clave: 'mantecatura', explicacion: 'Técnica italiana para terminar el risotto: se incorpora mantequilla fría y queso fuera del fuego, removiendo con energía para crear una emulsión cremosa. El risotto debe quedar fluido, no compacto.' },
        { receta_id: primeraReceta.id, palabra_clave: 'leche de tigre', explicacion: 'Líquido resultante de marinar el pescado en lima con ají, jengibre y ajo. En el ceviche peruano moderno, se prepara como base independiente licuando parte del pescado con los aromáticos. Es altamente ácido.' },
        { receta_id: primeraReceta.id, palabra_clave: 'marinado', explicacion: 'Proceso de sumergir un alimento en un líquido ácido o aromático para modificar su sabor y textura. La duración importa: un marinado corto aromatiza, uno largo puede "cocer" las proteínas (como en el ceviche) o ablandar tejido conectivo.' },
        { receta_id: primeraReceta.id, palabra_clave: 'roux', explicacion: 'Mezcla de partes iguales de mantequilla y harina cocinadas juntas que actúa como espesante. El color del roux (blanco, rubio u oscuro) según el tiempo de cocción determina su sabor: a más oscuro, más sabor pero menos poder espesante.' },
        { receta_id: primeraReceta.id, palabra_clave: 'farsa', explicacion: 'Término técnico para referirse al relleno de empanadillas, gyozas, croquetas u otras preparaciones. Una buena farsa tiene la textura, el sabor y la humedad correctos para no romper la masa que la contiene.' },
        { receta_id: primeraReceta.id, palabra_clave: 'confit', explicacion: 'Técnica de cocción sumergido en grasa (aceite o manteca) a temperatura controlada y baja (60-90 °C). El resultado es una textura muy tierna y jugosa, completamente distinta a la fritura convencional. También conserva el alimento.' },
        { receta_id: primeraReceta.id, palabra_clave: 'tataki', explicacion: 'Técnica japonesa de marcar brevemente el exterior de un trozo de carne o pescado a fuego muy alto dejando el interior completamente crudo. El contraste entre la costra exterior y el interior crudo define el plato.' },
        { receta_id: primeraReceta.id, palabra_clave: 'emulsión', explicacion: 'Mezcla estable de dos líquidos inmiscibles (normalmente agua y grasa). Se consigue batiendo uno de ellos en el otro muy lentamente. La lecitina del huevo o la proteína del miso actúan como emulsionantes naturales.' },
        { receta_id: primeraReceta.id, palabra_clave: 'nacarado', explicacion: 'Término que describe el aspecto del arroz cuando ha sido tostado correctamente antes de añadir el líquido en el risotto: los granos se vuelven opacos y brillantes como perlas. Indica que el almidón exterior se ha sellado.' },
        { receta_id: primeraReceta.id, palabra_clave: 'desnaturalizar', explicacion: 'Cambio irreversible en la estructura de las proteínas producido por calor, ácido o sal. En el ceviche, el zumo de lima desnaturaliza las proteínas del pescado desde el exterior, cambiando su textura sin aportarle calor.' },
        { receta_id: primeraReceta.id, palabra_clave: 'maillard', explicacion: 'Reacción química entre aminoácidos y azúcares que ocurre a partir de 140 °C y produce el dorado y los sabores complejos de la carne asada, el pan tostado o la costra de los salteados. No es caramelización: son procesos distintos.' },
        { receta_id: primeraReceta.id, palabra_clave: 'sous vide', explicacion: 'Cocción al vacío en bolsa sellada sumergida en baño de agua a temperatura precisa y constante. Permite controlar exactamente el punto de cocción sin riesgo de excederse. Requiere una temperatura final seguida de un marcado rápido para generar costra.' },
        { receta_id: primeraReceta.id, palabra_clave: 'escaldado', explicacion: 'Sumersión breve en agua hirviendo seguida de enfriamiento inmediato en agua con hielo. Se usa para fijar el color de las verduras, pelar tomates o eliminar impurezas de huesos. El choque térmico detiene la cocción instantáneamente.' },
        { receta_id: primeraReceta.id, palabra_clave: 'infusión', explicacion: 'Extracción de compuestos aromáticos de un sólido en un líquido caliente o frío durante un tiempo determinado. A diferencia de hervir, la infusión no modifica el sabor del sólido: solo extrae sus aromas y esencias.' },
        { receta_id: primeraReceta.id, palabra_clave: 'quenelle', explicacion: 'Forma ovalada elegante obtenida pasando una preparación blanda (mousse, helado, puré) entre dos cucharas en sentido contrario. Es una técnica de emplatado que da volumen y precisión a guarniciones y postres.' },
        { receta_id: primeraReceta.id, palabra_clave: 'curar', explicacion: 'Técnica de conservación y transformación que usa sal, azúcar y a veces ácido para deshidratar parcialmente un alimento y modificar su textura y sabor. El gravlax y el jamón ibérico son ejemplos de curado en frío y en seco respectivamente.' },
      ],
    });
  }

  console.log('20 anotaciones de estilo creadas');
  console.log('Seed completado: 2 usuarios, 80 recetas, 20 anotaciones de estilo');
}

// FUNCION AUXILIAR

interface BloqueInput {
  tipo: TipoBloque;
  orden: number;
  contenido: string;
  tiempo_estimado: number | null;
}

interface RecetaInput {
  titulo: string;
  categoria_menu: CategoriaMenu;
  estilo_culinario: EstiloCulinario;
  modo_preparacion: ModoPreparacion;
  dificultad: Dificultad;
  tiempo_preparacion: number;
  ingredientes_texto: string;
  tags: string[];
  bloques: BloqueInput[];
}

/**
 * Crea una receta con sus bloques en una sola operación de escritura anidada.
 * autor_id es null: estas recetas pertenecen al catálogo del sistema.
 */
async function crearReceta(input: RecetaInput): Promise<void> {
  await prisma.receta.create({
    data: {
      titulo: input.titulo,
      categoria_menu: input.categoria_menu,
      estilo_culinario: input.estilo_culinario,
      modo_preparacion: input.modo_preparacion,
      dificultad: input.dificultad,
      tiempo_preparacion: input.tiempo_preparacion,
      ingredientes_texto: input.ingredientes_texto,
      tags: input.tags,
      autor_id: null,
      bloques: {
        create: input.bloques.map((b) => ({
          tipo_bloque: b.tipo,
          orden: b.orden,
          contenido: b.contenido,
          tiempo_estimado: b.tiempo_estimado,
        })),
      },
    },
  });
}

// EJECUCION

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
