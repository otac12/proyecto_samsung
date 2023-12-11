

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';


DROP TABLE IF EXISTS `Carga` ;

CREATE TABLE IF NOT EXISTS `Carga` (
  `ID` INT NOT NULL,
  `costo` INT NULL,
  PRIMARY KEY (`ID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Estaciones`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Estaciones` ;

CREATE TABLE IF NOT EXISTS `Estaciones` (
  `ID` INT NOT NULL,
  `Localizacion` VARCHAR(45) NOT NULL,
  `Lugares_ocpuados` INT NOT NULL,
  `Lugares_disponibles` INT NOT NULL,
  PRIMARY KEY (`ID`))
ENGINE = InnoDB;



DROP TABLE IF EXISTS `Lugar` ;

CREATE TABLE IF NOT EXISTS `Lugar` (
  `ID` INT NOT NULL,
  `Estacion` INT NOT NULL,
  `Nombre` VARCHAR(45) NOT NULL,
  `status` TINYINT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `Nombre_UNIQUE` (`Nombre` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Metodos_pago`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Metodos_pago` ;

CREATE TABLE IF NOT EXISTS `Metodos_pago` (
  `ID` INT NOT NULL,
  `Metodo_pago` VARCHAR(45) NULL,
  `no_cuenta` VARCHAR(45) NULL,
  PRIMARY KEY (`ID`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Servicio`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Servicio` ;

CREATE TABLE IF NOT EXISTS `Servicio` (
  `ID` INT NOT NULL,
  `Tiempo_inicio` DATETIME NOT NULL,
  `Tiempo_final` DATETIME NULL,
  `Vehiculo` INT NOT NULL,
  `Carga` TINYINT NULL,
  `kWh` INT NULL,
  `Tipo_carga` INT NOT NULL,
  `Estacion` INT NOT NULL,
  `Usuario` INT NOT NULL,
  `Alerta` TINYINT NOT NULL,
  `Lugar` INT NOT NULL,
  `status` TINYINT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `ID_UNIQUE` (`ID` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Usuario`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Usuario` ;

CREATE TABLE IF NOT EXISTS `Usuario` (
  `ID` INT NOT NULL AUTO_INCREMENT,
  `Nombre` VARCHAR(45) NOT NULL,
  `Contrasena` VARCHAR(45) NOT NULL,
  `Correo` VARCHAR(45) NOT NULL,
  `Metodo_pago` INT NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `ID_UNIQUE` (`ID` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Vehiculos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `Vehiculos` ;

CREATE TABLE IF NOT EXISTS `Vehiculos` (
  `ID` INT NOT NULL,
  `Tipo` VARCHAR(45) NULL,
  `Costo_minuto` INT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE INDEX `ID_UNIQUE` (`ID` ASC) )
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
